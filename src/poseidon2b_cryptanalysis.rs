// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Paranoid Zero.

//! Source-pinned production correspondence for the algebraic attacks in
//! ePrint 2026/306.
//!
//! This module records the exact classical dedicated-attack projection that
//! can be instantiated from the paper for the fixed Parano1d profile. The
//! production QROM delta remains a separate premise of the end-to-end theorem.

use num_bigint::BigUint;

use crate::{
    exact::descriptive_log2_integer,
    parameters::{MERKLE_COMPRESSION_MODE, ProductionParameters},
};

pub const SKIPPING_CLASS_EPRINT: &str = "2026/306";
pub const SKIPPING_CLASS_REVIEWED_VERSION: &str = "2026-02-18";
pub const SKIPPING_CLASS_PDF_SHA256: &str =
    "8297df539a48859678ad2e4ba79d005a544e1a9686770a4f72a30ad358f76249";

const AUDITED_FIELD_BITS: u32 = 128;
const AUDITED_STATE_WIDTH: usize = 4;
const AUDITED_RATE_LANES: usize = 2;
const AUDITED_DIGEST_LANES: usize = 2;
const AUDITED_SBOX_EXPONENT: usize = 7;
const AUDITED_FULL_ROUNDS: usize = 8;
const AUDITED_PARTIAL_ROUNDS: usize = 58;

// Binary M4 from the Poseidon2b specification and Section 2.2 of ePrint
// 2026/306. At t=4 this is the complete external MDS matrix, not one block in
// the wide tensor construction analyzed by the paper's main attack tables.
const AUDITED_BINARY_M4: [[u128; 4]; 4] = [
    [0x5, 0x7, 0x1, 0x3],
    [0x4, 0x6, 0x1, 0x1],
    [0x1, 0x3, 0x5, 0x7],
    [0x1, 0x1, 0x4, 0x6],
];

const AUDITED_INTERNAL_MATRIX: [[u128; 4]; 4] = [
    [0x20, 0x1, 0x1, 0x1],
    [0x1, 0x2000, 0x1, 0x1],
    [0x1, 0x1, 0x200, 0x1],
    [0x1, 0x1, 0x1, 0x800],
];

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Poseidon2bCryptanalysisAudit {
    pub field_bits: u32,
    pub state_width: usize,
    pub rate_lanes: usize,
    pub capacity_lanes: usize,
    pub digest_lanes: usize,
    pub sbox_exponent: usize,
    pub full_rounds: usize,
    pub partial_rounds: usize,
    pub wide_tensor_round_skips_apply: bool,
    pub appendix_a_compression_applies: bool,
    pub skipped_full_rounds: usize,
    pub skipped_partial_rounds: usize,
    pub parameter_degrees: Vec<usize>,
    pub ideal_degree_base: usize,
    pub ideal_degree_exponent: u32,
    pub ideal_degree_upper_bound: BigUint,
    pub quadratic_work_projection: BigUint,
}

impl Poseidon2bCryptanalysisAudit {
    pub fn descriptive_ideal_degree_bits(&self) -> f64 {
        descriptive_log2_integer(&self.ideal_degree_upper_bound)
    }

    pub fn descriptive_quadratic_projection_bits(&self) -> f64 {
        descriptive_log2_integer(&self.quadratic_work_projection)
    }
}

/// Match the pinned production instance to ePrint 2026/306 and instantiate
/// the attack from Appendix A that applies to the t=4 Merkle construction.
pub fn audit(parameters: &ProductionParameters) -> Result<Poseidon2bCryptanalysisAudit, String> {
    let field_bits = u128::BITS;
    let capacity_lanes = parameters
        .poseidon_state_width
        .checked_sub(parameters.poseidon_rate_lanes)
        .ok_or_else(|| "Poseidon2b rate exceeds its state width".to_string())?;
    if !parameters.digest_bits.is_multiple_of(field_bits) {
        return Err("Poseidon2b digest width is not a whole number of field lanes".to_string());
    }
    let digest_lanes = usize::try_from(parameters.digest_bits / field_bits)
        .map_err(|_| "Poseidon2b digest lane count does not fit usize".to_string())?;

    let tuple = (
        field_bits,
        parameters.poseidon_state_width,
        parameters.poseidon_rate_lanes,
        digest_lanes,
        parameters.poseidon_sbox_exponent,
        parameters.poseidon_full_rounds,
        parameters.poseidon_partial_rounds,
    );
    let audited_tuple = (
        AUDITED_FIELD_BITS,
        AUDITED_STATE_WIDTH,
        AUDITED_RATE_LANES,
        AUDITED_DIGEST_LANES,
        AUDITED_SBOX_EXPONENT,
        AUDITED_FULL_ROUNDS,
        AUDITED_PARTIAL_ROUNDS,
    );
    if tuple != audited_tuple {
        return Err(format!(
            "Poseidon2b profile changed from the ePrint {SKIPPING_CLASS_EPRINT} specialization"
        ));
    }
    if parameters.poseidon_external_matrix != AUDITED_BINARY_M4
        || parameters.poseidon_internal_matrix != AUDITED_INTERNAL_MATRIX
    {
        return Err(format!(
            "Poseidon2b matrices changed from the ePrint {SKIPPING_CLASS_EPRINT} specialization"
        ));
    }
    if parameters.poseidon_merkle_compression != MERKLE_COMPRESSION_MODE {
        return Err(format!(
            "Poseidon2b Merkle mode changed from the ePrint {SKIPPING_CLASS_EPRINT} specialization"
        ));
    }

    // Appendix A gives a (1, [1] + [alpha]^(t/2-1)) round skip for MDS
    // two-to-one feed-forward compression. Here t=4, d=t/2=2 and alpha=7,
    // hence (1, [1, 7]). Theorem 5.1 gives
    //
    //   d_I <= alpha^(d(R_F-r_F) + (R_P-r_P)) * product(delta_i)
    //       = 7^(2(8-1) + 58) * 7
    //       = 7^73.
    let skipped_full_rounds = 1usize;
    let skipped_partial_rounds = 0usize;
    let parameter_degrees = vec![1, parameters.poseidon_sbox_exponent];
    let product_degree_exponent = u32::try_from(digest_lanes - 1)
        .map_err(|_| "Appendix A degree exponent does not fit u32".to_string())?;
    let remaining_full_degree = digest_lanes
        .checked_mul(parameters.poseidon_full_rounds - skipped_full_rounds)
        .ok_or_else(|| "Appendix A full-round exponent overflow".to_string())?;
    let remaining_partial_degree = parameters.poseidon_partial_rounds - skipped_partial_rounds;
    let ideal_degree_exponent = u32::try_from(remaining_full_degree + remaining_partial_degree)
        .map_err(|_| "Appendix A ideal-degree exponent does not fit u32".to_string())?
        .checked_add(product_degree_exponent)
        .ok_or_else(|| "Appendix A ideal-degree exponent overflow".to_string())?;
    let ideal_degree_base = parameters.poseidon_sbox_exponent;
    let ideal_degree_upper_bound = BigUint::from(ideal_degree_base).pow(ideal_degree_exponent);
    let quadratic_work_projection = ideal_degree_upper_bound.pow(2);
    let wide_tensor_round_skips_apply = [12, 16, 20, 24].contains(&parameters.poseidon_state_width);
    let appendix_a_compression_applies = digest_lanes * 2 == parameters.poseidon_state_width
        && parameters.poseidon_external_matrix == AUDITED_BINARY_M4
        && parameters.poseidon_merkle_compression == MERKLE_COMPRESSION_MODE;

    Ok(Poseidon2bCryptanalysisAudit {
        field_bits,
        state_width: parameters.poseidon_state_width,
        rate_lanes: parameters.poseidon_rate_lanes,
        capacity_lanes,
        digest_lanes,
        sbox_exponent: parameters.poseidon_sbox_exponent,
        full_rounds: parameters.poseidon_full_rounds,
        partial_rounds: parameters.poseidon_partial_rounds,
        wide_tensor_round_skips_apply,
        appendix_a_compression_applies,
        skipped_full_rounds,
        skipped_partial_rounds,
        parameter_degrees,
        ideal_degree_base,
        ideal_degree_exponent,
        ideal_degree_upper_bound,
        quadratic_work_projection,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn production_snapshot_instantiates_the_appendix_a_bound_exactly() {
        let parameters = ProductionParameters::load().unwrap();
        let result = audit(&parameters).unwrap();

        assert_eq!(result.field_bits, 128);
        assert_eq!(result.state_width, 4);
        assert_eq!(result.rate_lanes, 2);
        assert_eq!(result.capacity_lanes, 2);
        assert_eq!(result.digest_lanes, 2);
        assert!(!result.wide_tensor_round_skips_apply);
        assert!(result.appendix_a_compression_applies);
        assert_eq!(result.parameter_degrees, [1, 7]);
        assert_eq!(result.ideal_degree_exponent, 73);
        assert_eq!(
            result.ideal_degree_upper_bound.to_string(),
            "49221735352184872959961855190338177606846542622561400857262407"
        );
        assert_eq!(
            result.quadratic_work_projection.to_string(),
            "2422779231080526099722000834398871788804606268104681604592905959020265247411227403401328491417830386450157273478434455433649"
        );
    }

    #[test]
    fn unaudited_round_schedule_is_rejected() {
        let mut parameters = ProductionParameters::load().unwrap();
        parameters.poseidon_partial_rounds += 1;
        assert!(audit(&parameters).is_err());
    }

    #[test]
    fn unaudited_matrix_is_rejected() {
        let mut parameters = ProductionParameters::load().unwrap();
        parameters.poseidon_external_matrix[0][0] ^= 1;
        assert!(audit(&parameters).is_err());
    }

    #[test]
    fn unaudited_merkle_mode_is_rejected() {
        let mut parameters = ProductionParameters::load().unwrap();
        parameters.poseidon_merkle_compression = "sponge".to_string();
        assert!(audit(&parameters).is_err());
    }
}
