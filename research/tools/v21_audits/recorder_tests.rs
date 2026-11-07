
#[cfg(test)]
mod v21_closure_audit {
    use super::*;

    fn pair(b: &mut FieldR1csBuilder) -> (BaseSelectableParentRecorder, BaseSelectableParentRecorder) {
        let mut zero = BaseSelectableParentRecorder::new_c1(b"audit/current-parent");
        let mut one = BaseSelectableParentRecorder::new_c1(b"audit/current-parent");
        for (recorder, value) in [(&mut zero,11),(&mut one,29)] {
            recorder.data_wires.push(LinExpr::from_wire(b.alloc_f128(f128_from_u128(value))));
            recorder.challenge_wires.push(LinExpr::from_wire(b.alloc_f128(f128_from_u128(value+1))));
            recorder.data_flat.push(f128_from_u128(value));
            recorder.state[0] = f128_from_u128(value);
        }
        (zero,one)
    }

    #[test]
    fn audit_shared_prefix_binds_every_selected_source_expression() {
        for selected in [false,true] {
            let mut b = FieldR1csBuilder::new();
            let selector = LinExpr::from_wire(b.alloc_f128(if selected { F128::ONE } else { F128::ZERO }));
            let (zero,one) = pair(&mut b);
            let merged = BaseSelectableParentRecorder::select_prefix(&mut b,&selector,zero,one).unwrap();
            let expected = f128_from_u128(if selected {29} else {11});
            assert_eq!(merged.data_wires[0].eval(b.values()), expected);
            assert_eq!(merged.challenge_wires[0].eval(b.values()), f128_from_u128(if selected {30} else {12}));
            assert_eq!(merged.state[0], expected);
            let outputs = [merged.data_wires[0].clone(),merged.challenge_wires[0].clone()];
            let wires: Vec<_> = outputs.iter().map(|e| {
                let w = b.alloc_f128(e.eval(b.values()));
                pin_eq(&mut b,&LinExpr::from_wire(w),e);
                w
            }).collect();
            let (r1cs,z) = b.build();
            assert!(r1cs.satisfies(&z));
            for wire in wires {
                let mut altered=z.clone();
                altered[wire.0 as usize]+=F128::ONE;
                assert!(!r1cs.satisfies(&altered));
            }
        }
    }

    #[test]
    fn audit_shared_prefix_rejects_nonboolean_selector_and_different_layouts() {
        let mut b=FieldR1csBuilder::new();
        let (zero,one)=pair(&mut b);
        assert!(BaseSelectableParentRecorder::select_prefix(&mut b,&LinExpr::constant(f128_from_u128(2)),zero,one).is_none());
        let (zero,mut one)=pair(&mut b);
        one.data_wires.push(LinExpr::zero());
        assert!(BaseSelectableParentRecorder::select_prefix(&mut b,&LinExpr::zero(),zero,one).is_none());
    }
}
