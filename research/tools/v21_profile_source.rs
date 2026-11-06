use noid_recursive::acceptance::history_step::v2::capacity_banked as v21;
use serde_json::json;

fn hex(s: &str) -> [u8; 32] {
    assert_eq!(s.len(), 64);
    std::array::from_fn(|i| u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).unwrap())
}

fn main() {
    let args: Vec<_> = std::env::args().collect();
    let bytes = std::fs::read(&args[1]).unwrap();
    let metadata = noid_miner::v21_artifacts::decode_v21_runtime_metadata_pinned(&bytes, hex(&args[2])).unwrap();
    let classes: Vec<_> = v21::Class::ALL.into_iter().map(|class| {
        let config = metadata.parts().config().class(class);
        let pcs = config.pcs_params();
        let (_, tail) = noid_ivc_core::pcs::fri_commit_layout(pcs.k_code(), &pcs.fri_arities());
        json!({"class":class.wire_id(), "pages":config.pages(), "outer_m":config.outer_m(),
            "shape":{"m":config.shape().m,"k_log":config.shape().k_log,"k_skip":config.shape().k_skip,"const_pin":config.shape().const_pin},
            "pcs":{"m":pcs.m,"log_inv_rate":pcs.log_inv_rate,"log_batch_size":pcs.log_batch_size,"packed_message_log2":pcs.log_msg_len(),"message_log2":pcs.log_dim(),"codeword_log2":pcs.k_code(),"codeword_len":pcs.n_positions(),"total_codeword_len_f128":pcs.codeword_len_f128(),"plaintext_tail_len":tail.unwrap().0,"fri_arities":pcs.fri_arities()},
            "matrix_digest":metadata.bank().matrix_digest(class).iter().map(|x|format!("{x:02x}")).collect::<String>()})
    }).collect();
    let wallet = noid_gkr::zk_auth_qrom::conditional_selected_zk_auth_base_iop_ledger().unwrap();
    let mut keys = Vec::new();
    for path in &args[3..] {
        let b=std::fs::read(path).unwrap();
        assert_eq!(b.len(),304);
        let digest=noid_poseidon2b::native::poseidon2b_hash_byte_slices(b"NOID/SPARSE-MATRIX-KEY/C1/V1", &[&b[8..]]);
        keys.push(json!({"path":path,"digest":digest.iter().map(|x|format!("{x:02x}")).collect::<String>()}));
    }
    println!("{}",json!({"classes":classes,"wallet":{"query_count":wallet.query_term_exponent,"miss_numerator":wallet.single_query_miss_numerator.to_string(),"miss_denominator":wallet.single_query_miss_denominator.to_string(),"field_bad_numerator":wallet.all_field_bad_coin_upper_bound.to_string(),"field_denominator_bits":wallet.field_denominator_bits,"candidate_pairs":wallet.max_initial_candidate_pairs,"owner_bad_roots":wallet.algebraic.owner_sumchecks.to_string()},"keys":keys}));
}
