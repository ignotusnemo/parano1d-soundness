
#[cfg(test)]
mod v21_closure_audit {
    use super::*;
    use crate::storage::{AuthenticatedSnapshotMetadata, SnapshotHeaderInstallSource,
        SnapshotSegmentDescriptor, SnapshotStagingSession, VerifiedHeaderBatchRecord};

    fn small_context(path: &std::path::Path) -> MdbxChainContext {
        let store=MdbxStore::open(path).unwrap();
        let state=ChainState::with_log_slots(8);
        let header=BlockHeader {
            prev_block_hash:[0;32], state_root:state.cached_state_root(), tx_root:[0;32],
            timestamp:1000,height:0,miner_address:noid_poseidon2b::primitives::Address([0;32]),
            nonce:0,difficulty_target:[255;32],log_slots:8,active_slot_count:0,alloc_counter:0,
        };
        let hash=block_id(&header);
        let work=block_work(&header.difficulty_target);
        let finalized=FinalizedCheckpoint{height:0,hash};
        store.commit_block(&header,&hash,&BlockUndoLog::empty(0,8),&[],&[],&[],&[],None,
            state.circulating_supply_micronoid,&ConsensusMeta{tip_height:0,tip_hash:hash,cumulative_chainwork:work,finalized},false).unwrap();
        MdbxChainContext{store,state,recent_headers:std::collections::HashMap::from([(0,header)]),
            tip_height:0,tip_hash:hash,tip_chain_work:work,finalized,defer_finality_updates:false,reorg_staging:None}
    }

    fn target(base: BlockHeader) -> BlockHeader {
        BlockHeader{height:1,prev_block_hash:block_id(&base),timestamp:base.timestamp+1,..base}
    }

    fn terminal(header: &BlockHeader) -> Vec<u8> {
        let mut bytes=crate::history_step::HistoryStepTerminalMetadata::new(header.height,
            crate::block_header::semantic_header_id(header),0).unwrap().encode_prefix().to_vec();
        bytes.push(0xA5);
        bytes
    }

    struct Headers { base:VerifiedHeaderBatchRecord, tip:VerifiedHeaderBatchRecord,
        recent:Vec<BlockHeader>, consumed:bool }
    impl SnapshotHeaderInstallSource for Headers {
        fn base_record(&self)->VerifiedHeaderBatchRecord{self.base}
        fn target_record(&self)->VerifiedHeaderBatchRecord{self.tip}
        fn recent_headers(&self)->&[BlockHeader]{&self.recent}
        fn next_record(&mut self)->Result<Option<VerifiedHeaderBatchRecord>,String>{
            if self.consumed {Ok(None)} else {self.consumed=true;Ok(Some(self.tip))}
        }
    }
    fn headers(context:&MdbxChainContext,tip:BlockHeader)->Headers {
        let base=*context.tip_header();
        Headers{
            base:VerifiedHeaderBatchRecord{header:base,hash:block_id(&base),cumulative_chainwork:*context.tip_chain_work()},
            tip:VerifiedHeaderBatchRecord{header:tip,hash:block_id(&tip),cumulative_chainwork:add_work(context.tip_chain_work(),&block_work(&tip.difficulty_target))},
            recent:vec![base,tip],consumed:false,
        }
    }

    #[test]
    fn audit_snapshot_callback_and_metadata_guard_precede_any_state_mutation() {
        let directory=tempfile::tempdir().unwrap();
        let context=small_context(directory.path());
        let base=*context.tip_header();
        let tip=target(base);
        let mut calls=0;
        let rejected=context.verify_snapshot_boundary(tip,base,terminal(&tip),|claim|{
            calls+=1;
            assert_eq!(claim.header,tip);
            assert_eq!(claim.epoch_anchor_header,base);
            Err("intentional cryptographic callback rejection".into())
        });
        assert!(rejected.is_err());assert_eq!(calls,1);
        for bad in [BlockHeader{height:2,..tip},BlockHeader{state_root:[77;32],..tip}] {
            let rejected=context.verify_snapshot_boundary(bad,base,terminal(&tip),|_|{calls+=1;Ok(())});
            assert!(rejected.is_err());assert_eq!(calls,1);
        }
        assert_eq!(context.tip_hash(),block_id(&base));
        assert_eq!(context.store.get_chain_tip().unwrap(),Some((0,block_id(&base))));
        assert!(context.store.get_header(1).unwrap().is_none());
    }

    #[test]
    fn audit_snapshot_installs_the_exact_verified_boundary_atomically() {
        let directory=tempfile::tempdir().unwrap();
        let staging_root=tempfile::tempdir().unwrap();
        let mut context=small_context(directory.path());
        let base=*context.tip_header();let tip=target(base);let bytes=terminal(&tip);
        let boundary=context.verify_snapshot_boundary(tip,base,bytes.clone(),|_|Ok(())).unwrap();
        let metadata=AuthenticatedSnapshotMetadata::from_authenticated_header(tip,block_id(&tip),8).unwrap();
        let staging=SnapshotStagingSession::new(staging_root.path(),metadata,vec![]).unwrap().finalize().unwrap();
        let mut source=headers(&context,tip);
        context.apply_staged_state_snapshot(&staging,&boundary,&mut source,false).unwrap();
        assert_eq!(context.tip_height(),1);assert_eq!(context.tip_hash(),block_id(&tip));
        assert_eq!(context.state.cached_state_root(),tip.state_root);
        assert_eq!(context.store.get_chain_tip().unwrap(),Some((1,block_id(&tip))));
        assert_eq!(context.store.get_header(1).unwrap(),Some(tip));
        assert_eq!(context.store.get_history_step_terminal_at(1,block_id(&tip)).unwrap(),Some(bytes));
    }

    #[test]
    fn audit_late_segment_substitution_preserves_every_hot_and_durable_boundary() {
        let directory=tempfile::tempdir().unwrap();
        let staging_root=tempfile::tempdir().unwrap();
        let mut context=small_context(directory.path());
        let base=*context.tip_header();
        let old_meta=context.store.get_consensus_meta().unwrap();
        let slot=crate::fri_state::SlotValue::with_owner_fields(50,1,[noid_core::Block128::from(17u128),noid_core::Block128::from(19u128)]);
        let state=ChainState::from_sparse_utxos(8,&[(1,slot)],1).unwrap();
        let tip=BlockHeader{state_root:state.cached_state_root(),active_slot_count:1,alloc_counter:1,..target(base)};
        let encoded=crate::storage::serial::encode_sparse_segment_entries(8,&[(1,slot)]).unwrap();
        let descriptor=SnapshotSegmentDescriptor{segment_id:0,segment_root:state.cached_exact_segment_root(0).unwrap(),encoded_len:encoded.len() as u32};
        let metadata=AuthenticatedSnapshotMetadata::from_authenticated_header(tip,block_id(&tip),8).unwrap();
        let mut session=SnapshotStagingSession::new(staging_root.path(),metadata,vec![descriptor]).unwrap();
        session.accept_segment(0,8,&encoded).unwrap();let staging=session.finalize().unwrap();
        let staged=std::fs::read_dir(staging_root.path()).unwrap().next().unwrap().unwrap().path();
        let file=staged.join("segment-00000.bin");
        let mut permissions=std::fs::metadata(&file).unwrap().permissions();permissions.set_readonly(false);
        std::fs::set_permissions(&file,permissions).unwrap();
        let altered=crate::fri_state::SlotValue::with_owner_fields(50,1,[noid_core::Block128::from(18u128),noid_core::Block128::from(19u128)]);
        let substituted=crate::storage::serial::encode_sparse_segment_entries(8,&[(1,altered)]).unwrap();
        assert_eq!(encoded.len(),substituted.len());std::fs::write(&file,substituted).unwrap();
        let boundary=context.verify_snapshot_boundary(tip,base,terminal(&tip),|_|Ok(())).unwrap();
        let mut source=headers(&context,tip);
        assert!(context.apply_staged_state_snapshot(&staging,&boundary,&mut source,false).is_err());
        assert_eq!(context.tip_hash(),block_id(&base));assert_eq!(context.state.cached_state_root(),base.state_root);
        assert_eq!(context.store.get_chain_tip().unwrap(),Some((0,block_id(&base))));
        assert_eq!(context.store.get_consensus_meta().unwrap(),old_meta);
        assert!(context.store.get_header(1).unwrap().is_none());
        assert!(context.store.get_segment(0).unwrap().is_none());
        assert!(context.store.get_history_step_terminal_at(1,block_id(&tip)).unwrap().is_none());
    }
}
