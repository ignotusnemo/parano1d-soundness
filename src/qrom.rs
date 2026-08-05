// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Paranoid Zero.

//! Sequential ideal-QROM all-root certificate for invalid State acceptance.

use num_bigint::BigUint;
use num_traits::One;

use crate::{
    exact::{ExactProbability, descriptive_log2_integer},
    local::{
        HistorySelection, WalletLocalCertificate, select_unweighted_history,
        wallet_local_certificate,
    },
    parameters::ProductionParameters,
};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IdealQromBreakdown {
    pub transcript_rbr_term: ExactProbability,
    pub transcript_finite_term: ExactProbability,
    pub binding_collision_term: ExactProbability,
    pub total: ExactProbability,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IdealQromCertificate {
    pub wallet: WalletLocalCertificate,
    pub history: HistorySelection,
    pub local_rbr: ExactProbability,
    pub largest_certified_integer_work: BigUint,
    pub first_uncovered_integer_work: BigUint,
    pub at_two_to_64: IdealQromBreakdown,
    pub half_success_headroom_at_two_to_64: ExactProbability,
}

impl IdealQromCertificate {
    pub fn descriptive_boundary_bits(&self) -> f64 {
        descriptive_log2_integer(&self.first_uncovered_integer_work)
    }
}

pub fn history_query_squeeze_permutations(parameters: &ProductionParameters) -> u32 {
    parameters
        .history_classes
        .iter()
        .map(|class| {
            let positions_per_lane = 128usize / class.codeword_log2;
            let seed_lanes = (parameters.history_queries as usize).div_ceil(positions_per_lane);
            seed_lanes.div_ceil(parameters.poseidon_rate_lanes)
        })
        .max()
        .and_then(|value| u32::try_from(value).ok())
        .expect("production History squeeze count fits u32")
}

pub fn ideal_breakdown(
    query_cap: impl Into<BigUint>,
    minimum_response_bits: u32,
    digest_bits: u32,
    local_rbr: &ExactProbability,
) -> IdealQromBreakdown {
    let query_cap = query_cap.into();
    let lifting_factor = BigUint::from(6u32) * query_cap.pow(2);
    let transcript_rbr_term = local_rbr.scale_integer(lifting_factor.clone());
    let transcript_finite_term = ExactProbability::dyadic(
        &lifting_factor * ((&query_cap << 1usize) + BigUint::one()),
        minimum_response_bits,
    );
    let binding_collision_term =
        ExactProbability::dyadic(BigUint::from(6u32) * query_cap.pow(3), digest_bits);
    let total = transcript_rbr_term
        .add(&transcript_finite_term)
        .add(&binding_collision_term)
        .cap_one();
    IdealQromBreakdown {
        transcript_rbr_term,
        transcript_finite_term,
        binding_collision_term,
        total,
    }
}

pub fn maximum_query_cap_below_half(
    minimum_response_bits: u32,
    digest_bits: u32,
    local_rbr: &ExactProbability,
) -> BigUint {
    let half = ExactProbability::new(1u32, 2u32);
    let below = |cap: &BigUint| {
        ideal_breakdown(cap.clone(), minimum_response_bits, digest_bits, local_rbr).total < half
    };
    let mut low = BigUint::one();
    let mut high = BigUint::from(2u32);
    assert!(
        below(&low),
        "one ideal query must remain below half success"
    );
    while below(&high) {
        low = high;
        high = &low << 1usize;
    }
    while &high - &low > BigUint::one() {
        let middle = (&low + &high) >> 1usize;
        if below(&middle) {
            low = middle;
        } else {
            high = middle;
        }
    }
    low
}

pub fn certificate(parameters: &ProductionParameters) -> IdealQromCertificate {
    let wallet = wallet_local_certificate(parameters);
    let history = select_unweighted_history(parameters);
    let local_rbr = wallet
        .local_rbr
        .clone()
        .max(history.certificate.local_rbr.clone());
    let largest_certified_integer_work = maximum_query_cap_below_half(
        parameters.challenge_min_entropy_bits,
        parameters.digest_bits,
        &local_rbr,
    );
    let first_uncovered_integer_work = &largest_certified_integer_work + 1u32;
    let at_two_to_64 = ideal_breakdown(
        BigUint::one() << 64usize,
        parameters.challenge_min_entropy_bits,
        parameters.digest_bits,
        &local_rbr,
    );
    let half_success_headroom_at_two_to_64 = ExactProbability::new(1u32, 2u32)
        .checked_sub(&at_two_to_64.total)
        .expect("the selected profile certifies T=2^64 below half success");
    IdealQromCertificate {
        wallet,
        history,
        local_rbr,
        largest_certified_integer_work,
        first_uncovered_integer_work,
        at_two_to_64,
        half_success_headroom_at_two_to_64,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn production_history_query_response_uses_twelve_permutations() {
        let parameters = ProductionParameters::load().unwrap();
        assert_eq!(history_query_squeeze_permutations(&parameters), 12);
    }

    #[test]
    fn current_profile_exceeds_64_sequential_ideal_qrom_bits() {
        let parameters = ProductionParameters::load().unwrap();
        let result = certificate(&parameters);
        assert_eq!(
            result.largest_certified_integer_work,
            BigUint::from(30_121_082_641_781_720_121u128)
        );
        assert_eq!(
            result.first_uncovered_integer_work,
            BigUint::from(30_121_082_641_781_720_122u128)
        );
        assert!(result.descriptive_boundary_bits() > 64.7);
        assert!(result.at_two_to_64.total < ExactProbability::new(1u32, 2u32));
    }
}
