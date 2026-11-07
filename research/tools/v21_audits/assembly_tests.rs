
#[cfg(test)]
mod v21_closure_audit {
    use super::*;

    fn builder(profile: u8) -> FieldR1csBuilder {
        let mut b = FieldR1csBuilder::new();
        if profile & 1 != 0 { b.enable_fused_boolean_pins(); }
        if profile & 2 != 0 { b.enable_reused_linear_rows(); }
        if profile & 4 != 0 { b.enable_symbolic_product_aliases(); }
        b
    }

    #[test]
    fn audit_three_class_selector_rejects_detached_and_nonboolean_witnesses() {
        for profile in 0..8 {
            for class in Class::ALL {
                let mut b = builder(profile);
                let code = b.alloc_f128(f128_from_u128(class.wire_id() as u128));
                let selected = parent_selector(&mut b, &LinExpr::from_wire(code), class);
                let selector_wires: Vec<_> = selected.iter().map(|s| s.terms[0].0 as usize).collect();
                let (r1cs, z) = b.build();
                assert!(r1cs.satisfies(&z));
                for wire in selector_wires {
                    let mut altered = z.clone();
                    altered[wire] += F128::ONE;
                    assert!(!r1cs.satisfies(&altered), "profile={profile} class={class:?} wire={wire}");
                    altered[wire] = f128_from_u128(2);
                    assert!(!r1cs.satisfies(&altered));
                }
                for wrong in 0..4 {
                    if wrong == class.wire_id() { continue; }
                    let mut altered = z.clone();
                    altered[code.0 as usize] = f128_from_u128(wrong as u128);
                    assert!(!r1cs.satisfies(&altered));
                }
            }
        }
    }

    #[test]
    fn audit_all_three_lanes_preserve_or_replace_every_point_value_and_live_cell() {
        for profile in 0..8 {
            for class in Class::ALL {
                for active in [false, true] {
                    let mut b = builder(profile);
                    let lane = Lane::for_class(class);
                    let gate = LinExpr::from_wire(b.alloc_bool(active));
                    let prev: Vec<_> = (0..IO_LEN).map(|i| LinExpr::constant(if i == lane.live {F128::ONE} else {f128_from_u128((1000+i) as u128)})).collect();
                    let mut cells = vec![LinExpr::zero(); IO_LEN];
                    let folded = C1MatrixAccClaimTrace {
                        point: (0..lane.point_len()).map(|i| ExtExpr::new(
                            LinExpr::constant(f128_from_u128((3000+2*i) as u128)),
                            LinExpr::constant(f128_from_u128((3001+2*i) as u128)),
                        )).collect(),
                        value: ExtExpr::new(LinExpr::constant(f128_from_u128(5000)), LinExpr::constant(f128_from_u128(5001))),
                    };
                    let values: Vec<_> = folded.point.iter().flat_map(|p| [&p.lo,&p.hi])
                        .chain([&folded.value.lo,&folded.value.hi]).map(|v| v.eval(b.values())).collect();
                    let mut wires = Vec::new();
                    for offset in lane.point..=lane.live {
                        let value = if !active { prev[offset].eval(b.values()) }
                            else if offset == lane.live { F128::ONE }
                            else { values[offset-lane.point] };
                        let wire = b.alloc_f128(value);
                        cells[offset] = LinExpr::from_wire(wire);
                        wires.push(wire);
                    }
                    bind_lane(&mut b, &cells, &prev, lane, &gate, &folded);
                    let (r1cs, z) = b.build();
                    assert!(r1cs.satisfies(&z));
                    for wire in wires {
                        let mut altered = z.clone();
                        altered[wire.0 as usize] += F128::ONE;
                        assert!(!r1cs.satisfies(&altered), "profile={profile} class={class:?} active={active} wire={wire:?}");
                    }
                }
            }
        }
    }
}
