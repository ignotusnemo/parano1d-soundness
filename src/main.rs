use parano1d_soundness::{
    estimate, wallet_generalized_rbr_metrics, PRODUCTION, PRODUCTION_SOURCE_COMMIT,
};

fn main() {
    let result = estimate();
    let wallet_rbr = wallet_generalized_rbr_metrics();

    println!("ParanO(1)d soundness workbench");
    println!("production source: {PRODUCTION_SOURCE_COMMIT}");
    println!(
        "parameters: wallet q={} rate=1/2^{} grind={}; HistoryStep q={} rate=1/2^{} grind={}",
        PRODUCTION.wallet_query_count,
        PRODUCTION.wallet_log_inverse_rate,
        PRODUCTION.wallet_grind_bits,
        PRODUCTION.history_query_count,
        PRODUCTION.history_log_inverse_rate,
        PRODUCTION.history_grind_bits,
    );

    println!("\nA. Literal Plonky2 / Toy-Problem parameter score (conjectured, classical)");
    println!(
        "wallet                         raw {:>10.6}  capped {:>10.6}",
        result.wallet.literal_toy_problem_raw_bits, result.wallet.literal_toy_problem_bits,
    );
    println!(
        "HistoryStep                    raw {:>10.6}  capped {:>10.6}",
        result.history_classes[0].literal_toy_problem_raw_bits,
        result.history_classes[0].literal_toy_problem_bits,
    );
    println!(
        "pipeline weakest component                    {:>10.6}",
        result.literal_toy_problem_bits,
    );

    println!("\nB. Production-radius query-work score (+ mandatory pre-query grind)");
    println!(
        "wallet query event                            {:>10.6}",
        result.wallet.production_radius_plus_grind_bits,
    );
    for (name, class) in ["B64", "B255"].into_iter().zip(result.history_classes) {
        println!(
            "HistoryStep {name:<4} query event                   {:>10.6}",
            class.production_radius_plus_grind_bits,
        );
    }
    println!(
        "pipeline weakest component                    {:>10.6}",
        result.production_radius_plus_grind_weakest_bits,
    );
    println!(
        "pipeline additive query-event composition     {:>10.6}",
        result.production_radius_plus_grind_additive_bits,
    );

    println!("\nC. Wallet generalized RBR knowledge bound (classical, per-move scalar)");
    println!(
        "source BCHKS exceptional ceiling             {:>12}",
        wallet_rbr.source_correlated_agreement_bad_coins,
    );
    println!(
        "same-coin affine root                        {:>12}",
        wallet_rbr.gamma_affine_batch_bad_coins,
    );
    println!(
        "epsilon numerator / 2^128                    {:>12}",
        wallet_rbr.bad_coin_numerator,
    );
    println!(
        "certified scalar bound                       {:>12.6}",
        wallet_rbr.generalized_rbr_bits,
    );
    println!(
        "deterministic candidate triples (no error)   {:>12}",
        wallet_rbr.max_restoration_triples_checked,
    );

    println!("\nD. Finite error sums (no automatic grind credit)");
    println!(
        "wallet: field + (3/10)^64                    {:>10.6}",
        result.wallet.finite_no_grind_bits,
    );
    for (name, class) in ["B64", "B255"].into_iter().zip(result.history_classes) {
        println!(
            "HistoryStep {name:<4}: query + proximity             {:>10.6}",
            class.finite_no_grind_bits,
        );
    }
    println!(
        "fixed invalid block / per forgery             {:>10.6}",
        result.fixed_invalid_block_finite_no_grind_bits,
    );
    println!(
        "max-255 one-shot union (not work headline)    {:>10.6}",
        result.max_255_one_shot_finite_no_grind_bits,
    );

    println!("\nE. Finite sums with grind applied only to the later query term");
    println!(
        "fixed invalid block / per forgery             {:>10.6}",
        result.fixed_invalid_block_query_grind_only_bits,
    );
    println!(
        "max-255 one-shot union (not work headline)    {:>10.6}",
        result.max_255_one_shot_query_grind_only_bits,
    );

    println!("\nNo number above is labelled proved post-quantum security.");
}
