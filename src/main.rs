// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Paranoid Zero.

use parano1d_soundness::{
    calculate,
    parameters::{PINNED_SOURCE_REVISION, PRODUCTION_SNAPSHOT_PATH},
};

fn main() -> Result<(), String> {
    let mut exact = false;
    for argument in std::env::args().skip(1) {
        match argument.as_str() {
            "--exact" => exact = true,
            "-h" | "--help" => {
                println!("Usage: parano1d-soundness [--exact]");
                println!("  --exact  print the reduced rational certificates");
                return Ok(());
            }
            _ => return Err(format!("unknown argument: {argument}")),
        }
    }

    let certificate = calculate()?;
    let parameters = &certificate.parameters;
    let block_tiwari = &certificate.block_tiwari;
    let ideal = &certificate.ideal_qrom;
    let category_one = &certificate.category_one;

    println!("PARANO1D SOUNDNESS CERTIFICATE");
    println!("production snapshot validation: PASS");
    println!("snapshot: {PRODUCTION_SNAPSHOT_PATH}");
    println!("source revision: {PINNED_SOURCE_REVISION}");
    println!(
        "profile: W{}/H{}, challenge support=2^{}, digest={} bits",
        parameters.wallet_queries,
        parameters.history_queries,
        parameters.challenge_min_entropy_bits,
        parameters.digest_bits
    );
    println!(
        "History classes: B{} N=2^{}, B{} N=2^{}\n",
        parameters.history_classes[0].tier,
        parameters.history_classes[0].codeword_log2,
        parameters.history_classes[1].tier,
        parameters.history_classes[1].codeword_log2,
    );

    println!("BLOCK AND TIWARI FS-FRI, CLASSICAL ROM");
    println!("Target FRI security      {}", block_tiwari.target_fri_bits);
    println!(
        "Provable FS-FRI security {}",
        block_tiwari.provable.displayed_whole_bits()
    );
    println!(
        "Conjectured FS-FRI security {}",
        block_tiwari.conjectured.displayed_whole_bits()
    );
    println!(
        "provable RBR multiplicity: {}",
        block_tiwari.provable_history.certificate.multiplicity
    );
    if exact {
        println!(
            "provable minimizing queries: {}",
            block_tiwari.provable.minimizing_queries
        );
        println!(
            "provable first capped queries: {}",
            block_tiwari.provable.first_capped_queries
        );
        println!(
            "provable RBR exact: {}",
            block_tiwari.provable_rbr.exact_fraction()
        );
        println!(
            "provable minimum expected work exact: {}",
            block_tiwari.provable.exact_minimum_expected_work()
        );
    }
    println!(
        "provable descriptive log2(work): {:.12}",
        block_tiwari.provable.descriptive_bits()
    );
    if exact {
        println!(
            "conjectured RBR exact: {}",
            block_tiwari.conjectured_rbr.exact_fraction()
        );
        println!(
            "conjectured minimizing queries: {}",
            block_tiwari.conjectured.minimizing_queries
        );
        println!(
            "conjectured first capped queries: {}",
            block_tiwari.conjectured.first_capped_queries
        );
        println!(
            "conjectured minimum expected work exact: {}",
            block_tiwari.conjectured.exact_minimum_expected_work()
        );
    }
    println!(
        "conjectured descriptive log2(work): {:.12}\n",
        block_tiwari.conjectured.descriptive_bits()
    );

    println!("END TO END IDEAL QROM, FROM GENESIS INVALID STATE GAME");
    println!(
        "optimal local History multiplicity: {}",
        ideal.history.certificate.multiplicity
    );
    if exact {
        println!("local RBR exact: {}", ideal.local_rbr.exact_fraction());
        println!(
            "History query escape exact: {}",
            ideal.history.certificate.query_escape.exact_fraction()
        );
        println!(
            "History maximum proximity exact: {}",
            ideal
                .history
                .certificate
                .maximum_proximity_exception
                .exact_fraction()
        );
        println!(
            "History candidate switching exact: {}",
            ideal
                .history
                .certificate
                .candidate_switching_exception
                .exact_fraction()
        );
        println!(
            "History joint sidecar exact: {}",
            ideal
                .history
                .certificate
                .joint_sidecar_exception
                .exact_fraction()
        );
    }
    println!(
        "largest certified integer query work: {}",
        ideal.largest_certified_integer_work
    );
    println!(
        "first uncovered integer query work: {}",
        ideal.first_uncovered_integer_work
    );
    println!(
        "descriptive boundary bits: {:.12}",
        ideal.descriptive_boundary_bits()
    );
    println!(
        "epsilon_ideal(2^64) <= {}",
        ideal.at_two_to_64.total.decimal_ceiling(18)
    );
    println!(
        "sufficient fixed Poseidon2b condition at 2^64: Delta < {}\n",
        ideal.half_success_headroom_at_two_to_64.decimal_prefix(18)
    );
    if exact {
        println!(
            "epsilon RBR term at 2^64 exact: {}",
            ideal.at_two_to_64.transcript_rbr_term.exact_fraction()
        );
        println!(
            "epsilon finite term at 2^64 exact: {}",
            ideal.at_two_to_64.transcript_finite_term.exact_fraction()
        );
        println!(
            "epsilon binding term at 2^64 exact: {}",
            ideal.at_two_to_64.binding_collision_term.exact_fraction()
        );
        println!(
            "epsilon total at 2^64 exact: {}",
            ideal.at_two_to_64.total.exact_fraction()
        );
        println!(
            "fixed Poseidon2b headroom at 2^64 exact: {}\n",
            ideal.half_success_headroom_at_two_to_64.exact_fraction()
        );
    }

    println!("NIST POST-QUANTUM CRYPTOGRAPHY CATEGORY 1 RESOURCE ASSESSMENT");
    println!("security game: invalid terminal State accepted from genesis");
    println!("limiting typed event: {}", category_one.limiting_event);
    println!(
        "resource-aware History multiplicity: {}",
        category_one.history.certificate.multiplicity
    );
    println!(
        "coherent Poseidon2b response: gates={} depth={} gate-depth={}",
        category_one.poseidon_response_cost.logical_gates,
        category_one.poseidon_response_cost.logical_depth,
        category_one.poseidon_response_cost.gate_depth_product()
    );
    if exact {
        println!(
            "dominant-term half-success gate-depth floor exact: {}",
            category_one
                .dominant_half_success_gate_depth_floor
                .exact_fraction()
        );
        for event in &category_one.events {
            println!(
                "event {}: bad-density={} response-gd={} density-per-gd={}",
                event.id,
                event.bad_density.exact_fraction(),
                event.response_cost.gate_depth_product(),
                event.bad_density_per_gate_depth.exact_fraction()
            );
        }
    }
    println!(
        "dominant-term descriptive gate-depth bits: {:.12}",
        category_one
            .dominant_half_success_gate_depth_floor
            .descriptive_bits()
    );
    println!(
        "dominant-term margin over 2^170: {:.12} bits",
        category_one
            .dominant_half_success_gate_depth_floor
            .descriptive_bits()
            - 170.0
    );
    println!(
        "evaluated NIST MAXDEPTH points: 2^{}, 2^{}, 2^{}",
        category_one.evaluated_max_depth_bits[0],
        category_one.evaluated_max_depth_bits[1],
        category_one.evaluated_max_depth_bits[2]
    );
    println!(
        "largest finite envelope occurs at MAXDEPTH=2^{}",
        category_one.worst_case_max_depth_bits
    );
    println!(
        "ideal main term at the Category 1 envelope <= {}",
        category_one.category_one_main_term.decimal_ceiling(18)
    );
    if exact {
        println!(
            "ideal main term exact: {}",
            category_one.category_one_main_term.exact_fraction()
        );
    }
    println!(
        "typed finite term at the Category 1 envelope <= {}",
        category_one.typed_finite.total.decimal_ceiling(18)
    );
    if exact {
        println!(
            "typed database query cap: {}",
            category_one.typed_finite.database_query_cap
        );
        println!(
            "typed extraction instability exact: {}",
            category_one
                .typed_finite
                .extraction_instability
                .exact_fraction()
        );
        println!(
            "typed transcript collision instability exact: {}",
            category_one
                .typed_finite
                .transcript_collision_instability
                .exact_fraction()
        );
        println!(
            "typed finite term exact: {}",
            category_one.typed_finite.total.exact_fraction()
        );
    }
    println!(
        "global collision upper bound <= {}",
        category_one.global_collision_term.decimal_ceiling(18)
    );
    if exact {
        println!(
            "global collision exact: {}",
            category_one.global_collision_term.exact_fraction()
        );
    }
    println!(
        "complete ideal envelope <= {}",
        category_one.ideal_envelope.decimal_ceiling(18)
    );
    if exact {
        println!(
            "complete ideal envelope exact: {}",
            category_one.ideal_envelope.exact_fraction()
        );
    }
    println!(
        "sufficient fixed Poseidon2b delta bound: Delta < {}",
        category_one
            .fixed_poseidon2b_delta_headroom
            .decimal_prefix(18)
    );
    if exact {
        println!(
            "fixed Poseidon2b delta headroom exact: {}",
            category_one
                .fixed_poseidon2b_delta_headroom
                .exact_fraction()
        );
    }
    println!(
        "assessment: PASS under the typed parallel-QROM, coherent response-cost, and fixed-Poseidon2b delta premises"
    );

    Ok(())
}
