// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Paranoid Zero.

//! Exact evaluation of the Block and Tiwari classical-ROM work metric.

use num_bigint::BigUint;
use num_traits::{One, Zero};

use crate::{
    exact::{ExactProbability, SecurityBits, descriptive_log2_ratio},
    local::{HistorySelection, select_unweighted_history},
    parameters::ProductionParameters,
};

pub const TARGET_FRI_SECURITY_BITS: u32 = 128;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BlockTiwariMinimum {
    pub last_uncapped_queries: Option<BigUint>,
    pub first_capped_queries: BigUint,
    pub minimizing_queries: BigUint,
    pub soundness_at_minimizer: ExactProbability,
    /// `epsilon(Q)/Q`, the reciprocal of expected work.
    pub inverse_minimum_expected_work: ExactProbability,
}

impl BlockTiwariMinimum {
    pub fn certified_security_bits(&self) -> SecurityBits {
        self.inverse_minimum_expected_work.security_bits()
    }

    pub fn displayed_whole_bits(&self) -> u64 {
        match self.certified_security_bits() {
            SecurityBits::Exact(bits) => bits,
            SecurityBits::Interval { lower, .. } => lower,
            other => panic!("Block-Tiwari work has no finite bit display: {other}"),
        }
    }

    pub fn exact_minimum_expected_work(&self) -> String {
        format!(
            "{}/{}",
            self.inverse_minimum_expected_work.denominator(),
            self.inverse_minimum_expected_work.numerator()
        )
    }

    pub fn descriptive_bits(&self) -> f64 {
        descriptive_log2_ratio(
            self.inverse_minimum_expected_work.denominator(),
            self.inverse_minimum_expected_work.numerator(),
        )
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BlockTiwariCertificate {
    pub target_fri_bits: u32,
    pub provable_history: HistorySelection,
    pub provable_rbr: ExactProbability,
    pub conjectured_rbr: ExactProbability,
    pub provable: BlockTiwariMinimum,
    pub conjectured: BlockTiwariMinimum,
}

fn uncapped_soundness(
    random_oracle_output_bits: u32,
    queries: &BigUint,
    rbr_error: &ExactProbability,
) -> ExactProbability {
    assert!(!queries.is_zero());
    let rbr_term = rbr_error.scale_integer(queries.clone());
    let finite_numerator = BigUint::from(3u32) * (queries.pow(2) + BigUint::one());
    rbr_term.add(&ExactProbability::dyadic(
        finite_numerator,
        random_oracle_output_bits,
    ))
}

fn inverse_expected_work(
    random_oracle_output_bits: u32,
    queries: &BigUint,
    rbr_error: &ExactProbability,
) -> ExactProbability {
    let soundness = uncapped_soundness(random_oracle_output_bits, queries, rbr_error).cap_one();
    ExactProbability::new(
        soundness.numerator().clone(),
        soundness.denominator() * queries,
    )
}

pub fn minimize_expected_work(
    random_oracle_output_bits: u32,
    rbr_error: &ExactProbability,
) -> BlockTiwariMinimum {
    let one = BigUint::one();
    let capped = |queries: &BigUint| {
        let bound = uncapped_soundness(random_oracle_output_bits, queries, rbr_error);
        bound.numerator() >= bound.denominator()
    };

    let first_capped_queries = if capped(&one) {
        one.clone()
    } else {
        let mut low = one.clone();
        let mut high = BigUint::from(2u32);
        while !capped(&high) {
            low = high;
            high = &low << 1usize;
        }
        while &high - &low > one {
            let middle = (&low + &high) >> 1usize;
            if capped(&middle) {
                high = middle;
            } else {
                low = middle;
            }
        }
        high
    };
    let last_uncapped_queries = (first_capped_queries != one).then(|| &first_capped_queries - &one);

    let capped_inverse = ExactProbability::new(BigUint::one(), first_capped_queries.clone());
    let (minimizing_queries, soundness_at_minimizer, inverse_minimum_expected_work) =
        if let Some(last) = &last_uncapped_queries {
            let uncapped = uncapped_soundness(random_oracle_output_bits, last, rbr_error);
            let uncapped_inverse =
                inverse_expected_work(random_oracle_output_bits, last, rbr_error);
            if uncapped_inverse >= capped_inverse {
                (last.clone(), uncapped, uncapped_inverse)
            } else {
                (
                    first_capped_queries.clone(),
                    ExactProbability::one(),
                    capped_inverse,
                )
            }
        } else {
            (
                first_capped_queries.clone(),
                ExactProbability::one(),
                capped_inverse,
            )
        };

    BlockTiwariMinimum {
        last_uncapped_queries,
        first_capped_queries,
        minimizing_queries,
        soundness_at_minimizer,
        inverse_minimum_expected_work,
    }
}

pub fn conjectured_fri_rbr(parameters: &ProductionParameters) -> ExactProbability {
    let field_floor = ExactProbability::dyadic(1u32, parameters.challenge_min_entropy_bits);
    let query_term = ExactProbability::new(1u32, parameters.history_inverse_rate)
        .pow(parameters.history_queries);
    field_floor.max(query_term)
}

pub fn certificate(parameters: &ProductionParameters) -> BlockTiwariCertificate {
    let provable_history = select_unweighted_history(parameters);
    let provable_rbr = provable_history.certificate.local_rbr.clone();
    let conjectured_rbr = conjectured_fri_rbr(parameters);
    let provable = minimize_expected_work(parameters.digest_bits, &provable_rbr);
    let conjectured = minimize_expected_work(parameters.digest_bits, &conjectured_rbr);
    BlockTiwariCertificate {
        target_fri_bits: TARGET_FRI_SECURITY_BITS,
        provable_history,
        provable_rbr,
        conjectured_rbr,
        provable,
        conjectured,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn production_block_tiwari_row_rounds_like_the_paper() {
        let parameters = ProductionParameters::load().unwrap();
        let result = certificate(&parameters);
        assert_eq!(result.target_fri_bits, 128);
        assert_eq!(result.provable.displayed_whole_bits(), 127);
        assert_eq!(result.conjectured.displayed_whole_bits(), 127);
        assert!((result.provable.descriptive_bits() - 127.1945).abs() < 0.0001);
        assert!((result.conjectured.descriptive_bits() - 127.20751875).abs() < 1e-8);
    }

    #[test]
    fn production_integer_optimizer_boundaries_are_exact() {
        let parameters = ProductionParameters::load().unwrap();
        let result = certificate(&parameters);
        let integer = |digits: &[u8]| BigUint::parse_bytes(digits, 10).unwrap();

        let provable_last = integer(b"194697534987145646766651744479049925879");
        let provable_first = integer(b"194697534987145646766651744479049925880");
        assert_eq!(
            result.provable.last_uncapped_queries,
            Some(provable_last.clone())
        );
        assert_eq!(result.provable.first_capped_queries, provable_first.clone());
        assert_eq!(result.provable.minimizing_queries, provable_last.clone());
        assert!(
            uncapped_soundness(parameters.digest_bits, &provable_last, &result.provable_rbr)
                < ExactProbability::one()
        );
        assert!(
            uncapped_soundness(
                parameters.digest_bits,
                &provable_first,
                &result.provable_rbr
            ) >= ExactProbability::one()
        );

        let conjectured_first = integer(b"196462116142286827589391637123844718211");
        assert_eq!(
            result.conjectured.first_capped_queries,
            conjectured_first.clone()
        );
        assert_eq!(
            result.conjectured.minimizing_queries,
            conjectured_first.clone()
        );
        assert!(
            uncapped_soundness(
                parameters.digest_bits,
                &(&conjectured_first - 1u32),
                &result.conjectured_rbr
            ) < ExactProbability::one()
        );
        assert!(
            uncapped_soundness(
                parameters.digest_bits,
                &conjectured_first,
                &result.conjectured_rbr
            ) >= ExactProbability::one()
        );
    }

    #[test]
    fn conjectured_input_uses_trace_one_entropy_not_nominal_field_size() {
        let parameters = ProductionParameters::load().unwrap();
        assert_eq!(
            conjectured_fri_rbr(&parameters),
            ExactProbability::dyadic(1u32, 255)
        );
    }
}
