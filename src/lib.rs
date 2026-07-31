//! Reproducible classical soundness metrics for the committed ParanO(1)d
//! production parameters.
//!
//! The crate intentionally keeps three conventions separate:
//!
//! 1. a literal Plonky2/Toy-Problem parameter score;
//! 2. a query-work score using the protocol's actual acceptance radius and
//!    the mandatory pre-query grind;
//! 3. finite error sums with no automatic grind credit.
//!
//! None of these values is an end-to-end QROM theorem or a proved
//! post-quantum security level.

/// Main-repository revision from which [`PRODUCTION`] was copied.
pub const PRODUCTION_SOURCE_COMMIT: &str = "93b0252317208c20f8a769afb74681aa9389e286";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ProductionParameters {
    pub challenge_field_bits: u32,
    pub digest_bits: u32,
    pub wallet_query_count: u32,
    pub wallet_log_inverse_rate: u32,
    pub wallet_miss_numerator: u32,
    pub wallet_miss_denominator: u32,
    pub wallet_grind_bits: u32,
    pub max_authorizations_per_block: u32,
    pub history_query_count: u32,
    pub history_log_inverse_rate: u32,
    pub history_grind_bits: u32,
    pub history_log_message_columns: [u32; 2],
}

/// Parameters in the committed main-repository `HEAD`, not uncommitted
/// experimental changes in another worktree.
pub const PRODUCTION: ProductionParameters = ProductionParameters {
    challenge_field_bits: 128,
    digest_bits: 256,
    wallet_query_count: 64,
    wallet_log_inverse_rate: 5,
    wallet_miss_numerator: 3,
    wallet_miss_denominator: 10,
    wallet_grind_bits: 16,
    max_authorizations_per_block: 255,
    history_query_count: 125,
    history_log_inverse_rate: 2,
    history_grind_bits: 16,
    // B64/m23 and B255/m24 after the production packing split.
    history_log_message_columns: [18, 19],
};

/// Exact numerator of the wallet's finite field-exception term over
/// `2^128`, pinned by the production RBR ledger.
pub const WALLET_FIELD_BAD_NUMERATOR: u64 = 8_301_955_018;

/// Production geometry used by the wallet authorization RBR proof.
pub const WALLET_RBR_SOURCE_CODEWORD_FIELDS: u128 = 65_536;
pub const WALLET_RBR_SOURCE_MESSAGE_FIELDS: u128 = 2_048;
pub const WALLET_RBR_PAPER_DEGREE: u128 = WALLET_RBR_SOURCE_MESSAGE_FIELDS - 1;
pub const WALLET_RBR_RADIUS_NUMERATOR: u128 = 7;
pub const WALLET_RBR_RADIUS_DENOMINATOR: u128 = 10;
pub const WALLET_RBR_JOHNSON_MULTIPLICITY: u128 = 3;
pub const WALLET_RBR_MAX_CANDIDATES_PER_LIST: u128 = 3;
pub const WALLET_RBR_MAX_RESTORATION_TRIPLES: u128 = WALLET_RBR_MAX_CANDIDATES_PER_LIST.pow(3);
pub const WALLET_RBR_FIELD_DENOMINATOR_BITS: u32 = 128;
pub const WALLET_RBR_QUERY_MISS_CEILING_NUMERATOR: u128 = 116_843;

/// Q48 denominator used to turn the BCHKS square-root expression into an
/// integer upper bound without floating-point rounding.
pub const WALLET_RBR_SQRT_SCALE: u128 = 1u128 << 48;

/// Pinned result of the formula evaluated by
/// [`wallet_generalized_rbr_metrics`]. The value is repeated as a constant so
/// downstream tooling can compare an integer without trusting a formatted
/// floating-point number.
pub const WALLET_GENERALIZED_RBR_BAD_NUMERATOR: u128 = 4_157_831_959;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct WalletGeneralizedRbrMetrics {
    /// Theorem 4.6 exceptional-set ceiling for the source affine line.
    pub source_correlated_agreement_bad_coins: u128,
    /// Root bound for the nonzero affine batching discrepancy on the same
    /// gamma coin.
    pub gamma_affine_batch_bad_coins: u128,
    /// Deterministic extractor work, not a probability term.
    pub max_restoration_triples_checked: u128,
    /// Sum of the two preceding integer terms.
    pub bad_coin_numerator: u128,
    /// Every field-coin term is divided by `2^denominator_bits`.
    pub denominator_bits: u32,
    /// `-log2(bad_coin_numerator / 2^denominator_bits)`.
    pub generalized_rbr_bits: f64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WalletBchksLineDerivation {
    pub code_len: u128,
    pub message_len: u128,
    pub paper_degree: u128,
    pub rho_numerator: u128,
    pub rho_denominator: u128,
    pub sqrt_rho_lower_numerator: u128,
    pub sqrt_rho_lower_denominator: u128,
    pub rational_upper_numerator: u128,
    pub rational_upper_denominator: u128,
    pub bad_coin_upper_bound: u128,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WalletJohnsonListCertificate {
    pub code_len: u128,
    pub paper_degree: u128,
    pub required_agreements: u128,
    pub interpolation_weighted_degree: u128,
    pub interpolation_y_degree: u128,
    pub monomials_by_y_degree: [u128; 4],
    pub interpolation_unknowns: u128,
    pub interpolation_constraints: u128,
    pub interpolation_dimension_margin: u128,
    pub max_candidate_list_size: u128,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WalletRbrMove {
    OwnerRho,
    OwnerLambda,
    OwnerMleCheckRound(usize),
    OwnerEta,
    MainGamma,
    PhaseARound(usize),
    BetaSource,
    BetaMid,
    BetaTail,
    QuerySeeds,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum WalletRbrMoveError {
    /// At most `numerator` values of a uniform GF(2^128) challenge are bad.
    FieldBadSet { numerator: u128 },
    /// The 64 with-replacement queries all miss a disagreement set of density
    /// at least 7/10.
    QueryMiss {
        miss_numerator: u128,
        miss_denominator: u128,
        queries: u32,
    },
}

impl WalletRbrMoveError {
    pub fn probability(self) -> f64 {
        match self {
            Self::FieldBadSet { numerator } => {
                numerator as f64 / 2.0f64.powi(WALLET_RBR_FIELD_DENOMINATOR_BITS as i32)
            }
            Self::QueryMiss {
                miss_numerator,
                miss_denominator,
                queries,
            } => (miss_numerator as f64 / miss_denominator as f64).powi(queries as i32),
        }
    }

    pub fn bits(self) -> f64 {
        probability_bits(self.probability())
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct WalletRbrMoveBound {
    pub index: usize,
    pub move_: WalletRbrMove,
    pub error: WalletRbrMoveError,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct WalletMetrics {
    /// `q * log2(inverse_rate) + grind`, before the field-size cap.
    pub literal_toy_problem_raw_bits: f64,
    /// Literal Plonky2-style score after the field-size cap.
    pub literal_toy_problem_bits: f64,
    /// `-log2((3/10)^64)`.
    pub production_radius_query_bits: f64,
    /// Query score after charging the mandatory pre-query grind.
    pub production_radius_plus_grind_bits: f64,
    /// `-log2(8_301_955_018 / 2^128)`.
    pub field_exception_bits: f64,
    /// Sum of the field-exception and query-miss terms, no grind credit.
    pub finite_no_grind_bits: f64,
    /// Same finite sum, but the grind scales only the later query term.
    pub finite_query_grind_only_bits: f64,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct HistoryClassMetrics {
    pub log_message_columns: u32,
    pub domain_len: u64,
    pub proximity_radius: f64,
    pub literal_toy_problem_raw_bits: f64,
    pub literal_toy_problem_bits: f64,
    pub production_radius_query_bits: f64,
    pub production_radius_plus_grind_bits: f64,
    pub proximity_exception_bits: f64,
    pub finite_no_grind_bits: f64,
    pub finite_query_grind_only_bits: f64,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PipelineMetrics {
    pub wallet: WalletMetrics,
    pub history_classes: [HistoryClassMetrics; 2],

    /// Weakest-component literal Plonky2/Toy-Problem score.
    pub literal_toy_problem_bits: f64,

    /// Weakest query-work component using actual production radii and grind.
    pub production_radius_plus_grind_weakest_bits: f64,
    /// Additive composition of one wallet query event and one HistoryStep
    /// query event under the same convention.
    pub production_radius_plus_grind_additive_bits: f64,

    /// Fixed invalid block / one-forgery finite composition. One wallet
    /// authorization term and one HistoryStep term; no grind credit.
    pub fixed_invalid_block_finite_no_grind_bits: f64,
    /// One-shot union over 255 wallet proof events plus one HistoryStep event.
    /// This is not the operation-count headline.
    pub max_255_one_shot_finite_no_grind_bits: f64,

    /// Same two compositions when the pre-query grind scales only the query
    /// term that follows it. Kept separate from the no-grind finite ledger.
    pub fixed_invalid_block_query_grind_only_bits: f64,
    pub max_255_one_shot_query_grind_only_bits: f64,
}

#[inline]
fn probability_bits(probability: f64) -> f64 {
    assert!(probability.is_finite() && probability > 0.0);
    -probability.log2()
}

#[inline]
fn probability_from_bits(bits: f64) -> f64 {
    2.0f64.powf(-bits)
}

/// Return `-log2(sum_i 2^-bits_i)` without underflow for ordinary inputs.
pub fn union_probability_bits(bits: &[f64]) -> f64 {
    assert!(!bits.is_empty());
    assert!(bits.iter().all(|bits| bits.is_finite()));
    let minimum = bits.iter().copied().fold(f64::INFINITY, f64::min);
    let scaled_sum: f64 = bits.iter().map(|bits| 2.0f64.powf(minimum - bits)).sum();
    minimum - scaled_sum.log2()
}

/// Literal parameter check used by Plonky2:
/// `min(field_bits, queries * rate_bits + proof_of_work_bits)`.
pub fn literal_toy_problem_score(
    query_count: u32,
    log_inverse_rate: u32,
    grind_bits: u32,
    field_bits: u32,
) -> (f64, f64) {
    let raw = (query_count * log_inverse_rate + grind_bits) as f64;
    (raw, raw.min(field_bits as f64))
}

fn floor_sqrt_u128(value: u128) -> u128 {
    if value < 2 {
        return value;
    }

    let shift = (u128::BITS - value.leading_zeros()).div_ceil(2);
    let mut current = 1u128 << shift;
    loop {
        let next = (current + value / current) / 2;
        if next >= current {
            return current;
        }
        current = next;
    }
}

fn checked_product(left: u128, right: u128, context: &str) -> u128 {
    left.checked_mul(right).expect(context)
}

fn checked_sum(left: u128, right: u128, context: &str) -> u128 {
    left.checked_add(right).expect(context)
}

fn ceil_div(numerator: u128, denominator: u128) -> u128 {
    assert!(denominator != 0);
    checked_sum(numerator, denominator - 1, "ceil-div addition overflow") / denominator
}

/// Derive the finite BCHKS Theorem 4.6 exceptional-set bound for one
/// production RS layer.
///
/// The code is `RS[D, k]` in the paper's convention: `code_len = |D|`,
/// `message_len = k + 1`, `rho = k / |D|`, `gamma = 7/10`, and theorem
/// multiplicity `m = 3`. A certified Q48 lower bound for `sqrt(rho)` is used
/// only in denominators, so the final ceiling remains an upper bound.
pub fn wallet_bchks_line_derivation(
    code_len: u128,
    message_len: u128,
) -> WalletBchksLineDerivation {
    assert!(code_len != 0);
    assert!(message_len > 1 && message_len < code_len);

    let rho_numerator = message_len - 1;
    let rho_denominator = code_len;
    let radius_complement = WALLET_RBR_RADIUS_DENOMINATOR - WALLET_RBR_RADIUS_NUMERATOR;
    let radius_denominator_squared = checked_product(
        WALLET_RBR_RADIUS_DENOMINATOR,
        WALLET_RBR_RADIUS_DENOMINATOR,
        "radius denominator square overflow",
    );
    let radius_complement_squared = checked_product(
        radius_complement,
        radius_complement,
        "radius complement square overflow",
    );

    // gamma < 1 - sqrt(rho), checked without floating point.
    assert!(
        checked_product(
            rho_numerator,
            radius_denominator_squared,
            "Johnson-radius left side overflow",
        ) < checked_product(
            rho_denominator,
            radius_complement_squared,
            "Johnson-radius right side overflow",
        )
    );

    // ceil(sqrt(rho)/(1-sqrt(rho)-gamma)) <= 3 iff
    // 4*sqrt(rho) <= 3*(1-gamma). Together with the theorem's lower cap,
    // this pins m=3.
    assert!(
        checked_product(
            checked_product(16, rho_numerator, "multiplicity left side overflow"),
            radius_denominator_squared,
            "multiplicity left side overflow",
        ) <= checked_product(
            checked_product(9, rho_denominator, "multiplicity right side overflow"),
            radius_complement_squared,
            "multiplicity right side overflow",
        )
    );

    let sqrt_scale_squared = checked_product(
        WALLET_RBR_SQRT_SCALE,
        WALLET_RBR_SQRT_SCALE,
        "Q48 scale square overflow",
    );
    let scaled_square =
        checked_product(rho_numerator, sqrt_scale_squared, "scaled rho overflow") / rho_denominator;
    let sqrt_rho_lower_numerator = floor_sqrt_u128(scaled_square);
    assert!(sqrt_rho_lower_numerator != 0);
    assert!(
        checked_product(
            sqrt_rho_lower_numerator,
            sqrt_rho_lower_numerator,
            "lower-root certificate overflow",
        ) <= scaled_square
    );
    assert!(
        checked_product(
            sqrt_rho_lower_numerator + 1,
            sqrt_rho_lower_numerator + 1,
            "upper-root certificate overflow",
        ) > scaled_square
    );

    // With h=m+1/2=7/2, BCHKS Theorem 4.6 gives
    //
    // n * (2h^5 + 3h*gamma*rho) / (3*rho^(3/2))
    //     + h/sqrt(rho).
    //
    // 16_807 = 7^5. The factors 168 and 48 clear the powers of two
    // introduced by h=7/2. Replacing sqrt(rho) in each denominator by its
    // certified lower bound can only increase the expression.
    let curve_term = checked_sum(
        checked_product(
            checked_product(16_807, WALLET_RBR_RADIUS_DENOMINATOR, "curve term overflow"),
            rho_denominator,
            "curve term overflow",
        ),
        checked_product(
            checked_product(168, WALLET_RBR_RADIUS_NUMERATOR, "curve term overflow"),
            rho_numerator,
            "curve term overflow",
        ),
        "curve term addition overflow",
    );
    let upper_numerator = checked_product(
        checked_sum(
            checked_product(code_len, curve_term, "BCHKS numerator overflow"),
            checked_product(
                checked_product(
                    168,
                    WALLET_RBR_RADIUS_DENOMINATOR,
                    "BCHKS numerator overflow",
                ),
                rho_numerator,
                "BCHKS numerator overflow",
            ),
            "BCHKS numerator addition overflow",
        ),
        WALLET_RBR_SQRT_SCALE,
        "BCHKS scaled numerator overflow",
    );
    let upper_denominator = checked_product(
        checked_product(
            checked_product(
                48,
                WALLET_RBR_RADIUS_DENOMINATOR,
                "BCHKS denominator overflow",
            ),
            rho_numerator,
            "BCHKS denominator overflow",
        ),
        sqrt_rho_lower_numerator,
        "BCHKS denominator overflow",
    );

    WalletBchksLineDerivation {
        code_len,
        message_len,
        paper_degree: rho_numerator,
        rho_numerator,
        rho_denominator,
        sqrt_rho_lower_numerator,
        sqrt_rho_lower_denominator: WALLET_RBR_SQRT_SCALE,
        rational_upper_numerator: upper_numerator,
        rational_upper_denominator: upper_denominator,
        bad_coin_upper_bound: ceil_div(upper_numerator, upper_denominator),
    }
}

/// Evaluate the integer ceiling from [`wallet_bchks_line_derivation`].
pub fn wallet_johnson_bad_coin_upper_bound(code_len: u128, message_len: u128) -> u128 {
    wallet_bchks_line_derivation(code_len, message_len).bad_coin_upper_bound
}

/// Multiplicity-one Sudan interpolation certificate for the selected 7/10
/// list-decoding radius. A nonzero interpolant of Y-degree at most three has
/// at most three distinct linear factors `Y-p(X)`.
pub fn wallet_johnson_list_certificate(
    code_len: u128,
    message_len: u128,
) -> WalletJohnsonListCertificate {
    assert!(code_len != 0);
    assert!(message_len > 1 && message_len < code_len);
    let paper_degree = message_len - 1;
    let agreement_numerator = WALLET_RBR_RADIUS_DENOMINATOR - WALLET_RBR_RADIUS_NUMERATOR;
    let required_agreements = ceil_div(
        agreement_numerator * code_len,
        WALLET_RBR_RADIUS_DENOMINATOR,
    );
    let interpolation_weighted_degree = required_agreements - 1;
    let monomials_by_y_degree = std::array::from_fn(|y_degree| {
        let weight = paper_degree * y_degree as u128;
        if weight <= interpolation_weighted_degree {
            interpolation_weighted_degree - weight + 1
        } else {
            0
        }
    });
    let interpolation_unknowns = monomials_by_y_degree.iter().sum();
    let interpolation_constraints = code_len;
    assert!(interpolation_unknowns > interpolation_constraints);

    WalletJohnsonListCertificate {
        code_len,
        paper_degree,
        required_agreements,
        interpolation_weighted_degree,
        interpolation_y_degree: 3,
        monomials_by_y_degree,
        interpolation_unknowns,
        interpolation_constraints,
        interpolation_dimension_margin: interpolation_unknowns - interpolation_constraints,
        max_candidate_list_size: WALLET_RBR_MAX_CANDIDATES_PER_LIST,
    }
}

/// The eight production affine-code layers, from the source line through the
/// seven binary folds. Rate 1/32 is preserved at every layer.
pub fn wallet_johnson_layer_bad_coins() -> [u128; 8] {
    std::array::from_fn(|folds_done| {
        wallet_johnson_bad_coin_upper_bound(
            WALLET_RBR_SOURCE_CODEWORD_FIELDS >> folds_done,
            WALLET_RBR_SOURCE_MESSAGE_FIELDS >> folds_done,
        )
    })
}

/// Derive the separate scalar generalized-RBR error. This is the maximum
/// per-move error from the 30-move ledger, not a union over an accepting path.
pub fn wallet_generalized_rbr_metrics() -> WalletGeneralizedRbrMetrics {
    let source_correlated_agreement_bad_coins = wallet_johnson_bad_coin_upper_bound(
        WALLET_RBR_SOURCE_CODEWORD_FIELDS,
        WALLET_RBR_SOURCE_MESSAGE_FIELDS,
    );
    let gamma_affine_batch_bad_coins = 1;
    let bad_coin_numerator = checked_sum(
        source_correlated_agreement_bad_coins,
        gamma_affine_batch_bad_coins,
        "wallet generalized-RBR numerator overflow",
    );
    let error = bad_coin_numerator as f64 / 2.0f64.powi(WALLET_RBR_FIELD_DENOMINATOR_BITS as i32);

    WalletGeneralizedRbrMetrics {
        source_correlated_agreement_bad_coins,
        gamma_affine_batch_bad_coins,
        max_restoration_triples_checked: WALLET_RBR_MAX_RESTORATION_TRIPLES,
        bad_coin_numerator,
        denominator_bits: WALLET_RBR_FIELD_DENOMINATOR_BITS,
        generalized_rbr_bits: probability_bits(error),
    }
}

/// Exact 30-move generalized-RBR error inventory for the production wallet
/// base IOP. Grouped beta challenges remain one verifier move each.
pub fn wallet_rbr_move_bounds() -> Vec<WalletRbrMoveBound> {
    let layers = wallet_johnson_layer_bad_coins();
    let generalized = wallet_generalized_rbr_metrics();
    let mut bounds = Vec::with_capacity(30);

    let mut push_field = |move_: WalletRbrMove, numerator: u128| {
        let index = bounds.len();
        bounds.push(WalletRbrMoveBound {
            index,
            move_,
            error: WalletRbrMoveError::FieldBadSet { numerator },
        });
    };

    push_field(WalletRbrMove::OwnerRho, 11);
    push_field(WalletRbrMove::OwnerLambda, 1);
    for round in 0..11 {
        push_field(WalletRbrMove::OwnerMleCheckRound(round), 10);
    }
    push_field(WalletRbrMove::OwnerEta, 10);
    push_field(WalletRbrMove::MainGamma, generalized.bad_coin_numerator);
    for round in 0..11 {
        push_field(WalletRbrMove::PhaseARound(round), 2);
    }
    push_field(WalletRbrMove::BetaSource, layers[1..4].iter().sum());
    push_field(WalletRbrMove::BetaMid, layers[4..8].iter().sum());
    push_field(WalletRbrMove::BetaTail, 1);

    let index = bounds.len();
    bounds.push(WalletRbrMoveBound {
        index,
        move_: WalletRbrMove::QuerySeeds,
        error: WalletRbrMoveError::QueryMiss {
            miss_numerator: PRODUCTION.wallet_miss_numerator as u128,
            miss_denominator: PRODUCTION.wallet_miss_denominator as u128,
            queries: PRODUCTION.wallet_query_count,
        },
    });

    assert_eq!(bounds.len(), 30);
    bounds
}

pub fn wallet_metrics() -> WalletMetrics {
    let (literal_toy_problem_raw_bits, literal_toy_problem_bits) = literal_toy_problem_score(
        PRODUCTION.wallet_query_count,
        PRODUCTION.wallet_log_inverse_rate,
        PRODUCTION.wallet_grind_bits,
        PRODUCTION.challenge_field_bits,
    );

    let miss_probability =
        PRODUCTION.wallet_miss_numerator as f64 / PRODUCTION.wallet_miss_denominator as f64;
    let query_error = miss_probability.powi(PRODUCTION.wallet_query_count as i32);
    let query_error_after_grind =
        query_error * probability_from_bits(PRODUCTION.wallet_grind_bits as f64);
    let field_error =
        WALLET_FIELD_BAD_NUMERATOR as f64 / 2.0f64.powi(PRODUCTION.challenge_field_bits as i32);

    WalletMetrics {
        literal_toy_problem_raw_bits,
        literal_toy_problem_bits,
        production_radius_query_bits: probability_bits(query_error),
        production_radius_plus_grind_bits: probability_bits(query_error_after_grind),
        field_exception_bits: probability_bits(field_error),
        finite_no_grind_bits: probability_bits(field_error + query_error),
        finite_query_grind_only_bits: probability_bits(field_error + query_error_after_grind),
    }
}

pub fn history_class_metrics(log_message_columns: u32) -> HistoryClassMetrics {
    let (literal_toy_problem_raw_bits, literal_toy_problem_bits) = literal_toy_problem_score(
        PRODUCTION.history_query_count,
        PRODUCTION.history_log_inverse_rate,
        PRODUCTION.history_grind_bits,
        PRODUCTION.challenge_field_bits,
    );

    let inverse_rate = 1u64 << PRODUCTION.history_log_inverse_rate;
    let log_domain_len = log_message_columns + PRODUCTION.history_log_inverse_rate;
    let domain_len = 1u64 << log_domain_len;
    let relative_distance = (inverse_rate - 1) as f64 / inverse_rate as f64;
    let proximity_radius = relative_distance / 2.0 - 3.0 / (relative_distance * domain_len as f64);
    let query_error = (1.0 - proximity_radius).powi(PRODUCTION.history_query_count as i32);
    let query_error_after_grind =
        query_error * probability_from_bits(PRODUCTION.history_grind_bits as f64);
    let proximity_exception = (proximity_radius * domain_len as f64 + 1.0)
        / 2.0f64.powi(PRODUCTION.challenge_field_bits as i32);

    HistoryClassMetrics {
        log_message_columns,
        domain_len,
        proximity_radius,
        literal_toy_problem_raw_bits,
        literal_toy_problem_bits,
        production_radius_query_bits: probability_bits(query_error),
        production_radius_plus_grind_bits: probability_bits(query_error_after_grind),
        proximity_exception_bits: probability_bits(proximity_exception),
        finite_no_grind_bits: probability_bits(query_error + proximity_exception),
        finite_query_grind_only_bits: probability_bits(
            query_error_after_grind + proximity_exception,
        ),
    }
}

pub fn estimate() -> PipelineMetrics {
    let wallet = wallet_metrics();
    let history_classes = PRODUCTION
        .history_log_message_columns
        .map(history_class_metrics);

    let limiting_history_query_plus_grind_bits = history_classes
        .iter()
        .map(|class| class.production_radius_plus_grind_bits)
        .fold(f64::INFINITY, f64::min);
    let limiting_history_finite_no_grind_bits = history_classes
        .iter()
        .map(|class| class.finite_no_grind_bits)
        .fold(f64::INFINITY, f64::min);
    let limiting_history_finite_query_grind_only_bits = history_classes
        .iter()
        .map(|class| class.finite_query_grind_only_bits)
        .fold(f64::INFINITY, f64::min);

    let literal_toy_problem_bits = wallet
        .literal_toy_problem_bits
        .min(history_classes[0].literal_toy_problem_bits)
        .min(history_classes[1].literal_toy_problem_bits)
        // A 256-bit digest has a 128-bit classical collision ceiling.
        .min((PRODUCTION.digest_bits / 2) as f64);

    PipelineMetrics {
        wallet,
        history_classes,
        literal_toy_problem_bits,
        production_radius_plus_grind_weakest_bits: wallet
            .production_radius_plus_grind_bits
            .min(limiting_history_query_plus_grind_bits),
        production_radius_plus_grind_additive_bits: union_probability_bits(&[
            wallet.production_radius_plus_grind_bits,
            limiting_history_query_plus_grind_bits,
        ]),
        fixed_invalid_block_finite_no_grind_bits: union_probability_bits(&[
            wallet.finite_no_grind_bits,
            limiting_history_finite_no_grind_bits,
        ]),
        max_255_one_shot_finite_no_grind_bits: union_probability_bits(&[
            wallet.finite_no_grind_bits - (PRODUCTION.max_authorizations_per_block as f64).log2(),
            limiting_history_finite_no_grind_bits,
        ]),
        fixed_invalid_block_query_grind_only_bits: union_probability_bits(&[
            wallet.finite_query_grind_only_bits,
            limiting_history_finite_query_grind_only_bits,
        ]),
        max_255_one_shot_query_grind_only_bits: union_probability_bits(&[
            wallet.finite_query_grind_only_bits
                - (PRODUCTION.max_authorizations_per_block as f64).log2(),
            limiting_history_finite_query_grind_only_bits,
        ]),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn close(left: f64, right: f64, tolerance: f64) {
        assert!(
            (left - right).abs() <= tolerance,
            "left={left:.12}, right={right:.12}, tolerance={tolerance}"
        );
    }

    #[test]
    fn committed_production_parameters_are_pinned() {
        assert_eq!(PRODUCTION_SOURCE_COMMIT.len(), 40);
        assert_eq!(PRODUCTION.wallet_query_count, 64);
        assert_eq!(PRODUCTION.wallet_log_inverse_rate, 5);
        assert_eq!(PRODUCTION.wallet_grind_bits, 16);
        assert_eq!(PRODUCTION.history_query_count, 125);
        assert_eq!(PRODUCTION.history_log_inverse_rate, 2);
        assert_eq!(PRODUCTION.history_grind_bits, 16);
        assert_eq!(PRODUCTION.history_log_message_columns, [18, 19]);
    }

    #[test]
    fn literal_toy_problem_scores_are_reproduced() {
        let result = estimate();
        close(result.wallet.literal_toy_problem_raw_bits, 336.0, 0.0);
        close(result.wallet.literal_toy_problem_bits, 128.0, 0.0);
        for class in result.history_classes {
            close(class.literal_toy_problem_raw_bits, 266.0, 0.0);
            close(class.literal_toy_problem_bits, 128.0, 0.0);
        }
        close(result.literal_toy_problem_bits, 128.0, 0.0);
    }

    #[test]
    fn wallet_metrics_are_reproduced() {
        let wallet = wallet_metrics();
        close(wallet.production_radius_query_bits, 111.165_798_027, 1e-9);
        close(
            wallet.production_radius_plus_grind_bits,
            127.165_798_027,
            1e-9,
        );
        close(wallet.field_exception_bits, 95.049_196_031, 1e-9);
        close(wallet.finite_no_grind_bits, 95.049_175_726, 1e-9);
        close(wallet.finite_query_grind_only_bits, 95.049_196_031, 1e-9);
    }

    #[test]
    fn wallet_bchks_formula_is_reproduced_from_production_geometry() {
        assert_eq!(WALLET_RBR_PAPER_DEGREE, 2_047);
        assert_eq!(WALLET_RBR_JOHNSON_MULTIPLICITY, 3);
        let source = wallet_bchks_line_derivation(
            WALLET_RBR_SOURCE_CODEWORD_FIELDS,
            WALLET_RBR_SOURCE_MESSAGE_FIELDS,
        );
        assert_eq!(source.sqrt_rho_lower_numerator, 49_746_066_706_335);
        assert_eq!(source.sqrt_rho_lower_denominator, 1u128 << 48);
        assert_eq!(
            source.rational_upper_numerator,
            203_228_569_801_111_718_241_482_309_632
        );
        assert_eq!(
            source.rational_upper_denominator,
            48_878_495_302_976_517_600
        );
        assert!(
            source.sqrt_rho_lower_numerator.pow(2) * source.rho_denominator
                <= source.rho_numerator * source.sqrt_rho_lower_denominator.pow(2)
        );
        assert!(
            (source.sqrt_rho_lower_numerator + 1).pow(2) * source.rho_denominator
                > source.rho_numerator * source.sqrt_rho_lower_denominator.pow(2)
        );
        assert_eq!(
            wallet_johnson_layer_bad_coins(),
            [
                4_157_831_958,
                2_080_440_085,
                1_041_746_946,
                522_405_991,
                262_746_836,
                132_940_269,
                68_084_528,
                35_758_249,
            ]
        );
    }

    #[test]
    fn wallet_list_size_three_has_an_integer_interpolation_certificate() {
        let source = wallet_johnson_list_certificate(
            WALLET_RBR_SOURCE_CODEWORD_FIELDS,
            WALLET_RBR_SOURCE_MESSAGE_FIELDS,
        );
        assert_eq!(source.required_agreements, 19_661);
        assert_eq!(source.interpolation_weighted_degree, 19_660);
        assert_eq!(source.interpolation_y_degree, 3);
        assert_eq!(
            source.monomials_by_y_degree,
            [19_661, 17_614, 15_567, 13_520]
        );
        assert_eq!(source.interpolation_unknowns, 66_362);
        assert_eq!(source.interpolation_constraints, 65_536);
        assert_eq!(source.interpolation_dimension_margin, 826);
        assert_eq!(source.max_candidate_list_size, 3);

        for folds_done in 0..8 {
            let certificate = wallet_johnson_list_certificate(
                WALLET_RBR_SOURCE_CODEWORD_FIELDS >> folds_done,
                WALLET_RBR_SOURCE_MESSAGE_FIELDS >> folds_done,
            );
            assert!(certificate.interpolation_dimension_margin > 0);
            assert_eq!(certificate.max_candidate_list_size, 3);
        }
    }

    #[test]
    fn wallet_generalized_rbr_formula_is_pinned_separately() {
        let rbr = wallet_generalized_rbr_metrics();
        assert_eq!(rbr.source_correlated_agreement_bad_coins, 4_157_831_958);
        assert_eq!(rbr.gamma_affine_batch_bad_coins, 1);
        assert_eq!(rbr.max_restoration_triples_checked, 27);
        assert_eq!(rbr.bad_coin_numerator, 4_157_831_959);
        assert_eq!(rbr.bad_coin_numerator, WALLET_GENERALIZED_RBR_BAD_NUMERATOR);
        assert_eq!(rbr.denominator_bits, 128);
        close(rbr.generalized_rbr_bits, 96.046_815_693_930_09, 1e-12);

        // The 27 candidate triples are deterministic extractor work. They
        // must never be added to, or multiplied into, the error numerator.
        assert_ne!(
            rbr.bad_coin_numerator,
            rbr.source_correlated_agreement_bad_coins + rbr.max_restoration_triples_checked
        );
    }

    #[test]
    fn all_thirty_wallet_rbr_moves_are_bounded_by_main_gamma() {
        let bounds = wallet_rbr_move_bounds();
        let scalar = wallet_generalized_rbr_metrics();
        assert_eq!(bounds.len(), 30);
        assert_eq!(bounds[0].move_, WalletRbrMove::OwnerRho);
        assert_eq!(bounds[13].move_, WalletRbrMove::OwnerEta);
        assert_eq!(bounds[14].move_, WalletRbrMove::MainGamma);
        assert_eq!(bounds[26].move_, WalletRbrMove::BetaSource);
        assert_eq!(bounds[27].move_, WalletRbrMove::BetaMid);
        assert_eq!(bounds[28].move_, WalletRbrMove::BetaTail);
        assert_eq!(bounds[29].move_, WalletRbrMove::QuerySeeds);
        assert!(bounds
            .iter()
            .enumerate()
            .all(|(index, bound)| bound.index == index));

        let [gamma] = bounds
            .iter()
            .filter(|bound| bound.move_ == WalletRbrMove::MainGamma)
            .collect::<Vec<_>>()
            .try_into()
            .expect("exactly one MainGamma move");
        assert_eq!(
            gamma.error,
            WalletRbrMoveError::FieldBadSet {
                numerator: WALLET_GENERALIZED_RBR_BAD_NUMERATOR
            }
        );

        let beta_source = bounds[26].error;
        let beta_mid = bounds[27].error;
        assert_eq!(
            beta_source,
            WalletRbrMoveError::FieldBadSet {
                numerator: 3_644_593_022
            }
        );
        assert_eq!(
            beta_mid,
            WalletRbrMoveError::FieldBadSet {
                numerator: 499_529_882
            }
        );

        let scalar_probability = 2.0f64.powf(-scalar.generalized_rbr_bits);
        let field_denominator = 2.0f64.powi(WALLET_RBR_FIELD_DENOMINATOR_BITS as i32);
        let query_probability = bounds[29].error.probability();
        assert!(
            116_842.0 / field_denominator < query_probability
                && query_probability
                    <= WALLET_RBR_QUERY_MISS_CEILING_NUMERATOR as f64 / field_denominator
        );
        for bound in bounds {
            assert!(
                bound.error.probability() <= scalar_probability * (1.0 + 1e-14),
                "move {:?} exceeds scalar: {:.16e} > {:.16e}",
                bound.move_,
                bound.error.probability(),
                scalar_probability,
            );
        }
    }

    #[test]
    fn generalized_rbr_scalar_is_not_accepting_path_soundness() {
        let generalized = wallet_generalized_rbr_metrics();
        let accepting_path = wallet_metrics();
        close(generalized.generalized_rbr_bits, 96.046_815_694, 1e-9);
        close(accepting_path.finite_no_grind_bits, 95.049_175_726, 1e-9);
        assert!(generalized.generalized_rbr_bits > accepting_path.finite_no_grind_bits);
    }

    #[test]
    fn committed_history_classes_are_reproduced() {
        let [b64, b255] = PRODUCTION
            .history_log_message_columns
            .map(history_class_metrics);

        close(b64.production_radius_query_bits, 84.757_887_453, 1e-9);
        close(b64.production_radius_plus_grind_bits, 100.757_887_453, 1e-9);
        close(b64.proximity_exception_bits, 109.415_048_506, 1e-9);
        close(b64.finite_no_grind_bits, 84.757_887_399, 1e-9);
        close(b64.finite_query_grind_only_bits, 100.754_318_244, 1e-9);

        close(b255.production_radius_query_bits, 84.758_437_795, 1e-9);
        close(
            b255.production_radius_plus_grind_bits,
            100.758_437_795,
            1e-9,
        );
        close(b255.proximity_exception_bits, 108.415_043_003, 1e-9);
        close(b255.finite_no_grind_bits, 84.758_437_686, 1e-9);
        close(b255.finite_query_grind_only_bits, 100.751_305_444, 1e-9);
    }

    #[test]
    fn composition_metrics_do_not_mix_semantics() {
        let result = estimate();
        close(
            result.production_radius_plus_grind_weakest_bits,
            100.757_887_453,
            1e-9,
        );
        close(
            result.production_radius_plus_grind_additive_bits,
            100.757_887_437,
            1e-9,
        );
        close(
            result.fixed_invalid_block_finite_no_grind_bits,
            84.756_736_559,
            1e-9,
        );
        close(
            result.max_255_one_shot_finite_no_grind_bits,
            84.490_657_275,
            1e-9,
        );
        close(
            result.fixed_invalid_block_query_grind_only_bits,
            95.021_746_780,
            1e-9,
        );
        close(
            result.max_255_one_shot_query_grind_only_bits,
            87.054_733_923,
            1e-9,
        );
    }

    #[test]
    fn one_shot_union_is_not_used_as_per_forgery_work() {
        let result = estimate();
        assert!(
            result.max_255_one_shot_finite_no_grind_bits
                < result.fixed_invalid_block_finite_no_grind_bits
        );
        close(
            (PRODUCTION.max_authorizations_per_block as f64).log2(),
            7.994_353_437,
            1e-9,
        );
    }
}
