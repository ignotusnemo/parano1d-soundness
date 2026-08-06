// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Paranoid Zero.

//! Typed projection of the source-pinned production snapshot.

use serde::Deserialize;

pub const PINNED_SOURCE_REPOSITORY: &str = "https://github.com/ignotusnemo/parano1d";
pub const PINNED_SOURCE_REVISION: &str = "39626b22d53cf2f2c480a7e28446c197dca68043";
pub const PRODUCTION_SNAPSHOT_PATH: &str = "model/production.toml";
pub const PRODUCTION_SNAPSHOT: &str = include_str!("../model/production.toml");

const SNAPSHOT_SCHEMA: u32 = 1;
const SNAPSHOT_NAME: &str = "parano1d-production-soundness";

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HistoryClassParameters {
    pub tier: usize,
    pub message_log2: usize,
    pub codeword_log2: usize,
    pub codeword_len: u64,
    pub inverse_rate: u64,
    pub plaintext_tail_len: u64,
    pub fri_arities: Vec<usize>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ProductionParameters {
    pub source_repository: String,
    pub source_revision: String,
    pub challenge_min_entropy_bits: u32,
    pub digest_bits: u32,
    pub wallet_inverse_rate: u64,
    pub wallet_queries: u32,
    pub wallet_radius_numerator: u64,
    pub wallet_radius_denominator: u64,
    pub wallet_field_bad_numerator: u128,
    pub wallet_query_seed_lanes: usize,
    pub history_inverse_rate: u64,
    pub history_queries: u32,
    pub history_classes: [HistoryClassParameters; 2],
    pub history_max_algebraic_roots: u32,
    pub history_joint_sidecar_roots: u32,
    pub poseidon_state_width: usize,
    pub poseidon_rate_lanes: usize,
    pub poseidon_sbox_exponent: usize,
    pub poseidon_full_rounds: usize,
    pub poseidon_partial_rounds: usize,
}

#[derive(Debug, Deserialize)]
struct Snapshot {
    schema: u32,
    name: String,
    description: String,
    source_repository: String,
    source_revision: String,
    continued_currentness_guaranteed: bool,
    profile: ProfileSnapshot,
    correspondence: CorrespondenceSnapshot,
}

#[derive(Debug, Deserialize)]
struct ProfileSnapshot {
    challenge_min_entropy_bits: u32,
    digest_bits: u32,
    wallet: WalletSnapshot,
    history: HistorySnapshot,
    poseidon2b: Poseidon2bSnapshot,
}

#[derive(Debug, Deserialize)]
struct WalletSnapshot {
    inverse_rate: u64,
    queries: u32,
    radius_numerator: u64,
    radius_denominator: u64,
    field_bad_numerator: u128,
    query_seed_lanes: usize,
}

#[derive(Debug, Deserialize)]
struct HistorySnapshot {
    inverse_rate: u64,
    queries: u32,
    zerocheck_k_skip: u32,
    joint_sidecar_groups: u32,
    classes: Vec<HistoryClassSnapshot>,
}

#[derive(Clone, Debug, Deserialize)]
struct HistoryClassSnapshot {
    tier: usize,
    message_log2: usize,
    codeword_log2: usize,
    codeword_len: u64,
    inverse_rate: u64,
    plaintext_tail_len: u64,
    fri_arities: Vec<usize>,
}

#[derive(Debug, Deserialize)]
struct Poseidon2bSnapshot {
    state_width: usize,
    rate_lanes: usize,
    sbox_exponent: usize,
    full_rounds: usize,
    partial_rounds: usize,
}

#[derive(Debug, Deserialize)]
struct CorrespondenceSnapshot {
    wallet_ledger_queries: u32,
    wallet_geometry_queries: u32,
    wallet_ledger_challenge_bits: u32,
    c1_challenge_min_entropy_bits: u32,
    history_step_queries: u32,
    basefold_queries: u32,
}

impl ProductionParameters {
    pub fn load() -> Result<Self, String> {
        load_snapshot(PRODUCTION_SNAPSHOT)
    }
}

fn checked_history_class(
    class: HistoryClassSnapshot,
    expected_inverse_rate: u64,
) -> Result<HistoryClassParameters, String> {
    if class.inverse_rate != expected_inverse_rate {
        return Err(format!(
            "B{} inverse rate differs from the History profile",
            class.tier
        ));
    }
    if !class.inverse_rate.is_power_of_two() {
        return Err(format!(
            "B{} inverse rate is not a power of two",
            class.tier
        ));
    }
    let rate_log2 = usize::try_from(class.inverse_rate.ilog2())
        .map_err(|_| format!("B{} inverse-rate logarithm does not fit usize", class.tier))?;
    if class.message_log2.checked_add(rate_log2) != Some(class.codeword_log2) {
        return Err(format!(
            "B{} message and codeword dimensions diverged",
            class.tier
        ));
    }
    let expected_codeword_len = 1u64
        .checked_shl(
            u32::try_from(class.codeword_log2)
                .map_err(|_| format!("B{} codeword logarithm does not fit u32", class.tier))?,
        )
        .ok_or_else(|| format!("B{} codeword length does not fit u64", class.tier))?;
    if class.codeword_len != expected_codeword_len {
        return Err(format!("B{} codeword length diverged", class.tier));
    }
    if !class.plaintext_tail_len.is_power_of_two() || class.plaintext_tail_len > class.codeword_len
    {
        return Err(format!("B{} plaintext tail is invalid", class.tier));
    }
    if class.fri_arities.is_empty() || class.fri_arities.contains(&0) {
        return Err(format!("B{} FRI arity schedule is invalid", class.tier));
    }
    Ok(HistoryClassParameters {
        tier: class.tier,
        message_log2: class.message_log2,
        codeword_log2: class.codeword_log2,
        codeword_len: class.codeword_len,
        inverse_rate: class.inverse_rate,
        plaintext_tail_len: class.plaintext_tail_len,
        fri_arities: class.fri_arities,
    })
}

fn load_snapshot(input: &str) -> Result<ProductionParameters, String> {
    let snapshot: Snapshot =
        toml::from_str(input).map_err(|error| format!("invalid production snapshot: {error}"))?;
    if snapshot.schema != SNAPSHOT_SCHEMA {
        return Err(format!(
            "unsupported production snapshot schema {}",
            snapshot.schema
        ));
    }
    if snapshot.name != SNAPSHOT_NAME {
        return Err("unexpected production snapshot name".to_string());
    }
    if snapshot.description.trim().is_empty() {
        return Err("production snapshot description is empty".to_string());
    }
    if snapshot.source_repository != PINNED_SOURCE_REPOSITORY {
        return Err("production snapshot repository pin diverged".to_string());
    }
    if snapshot.source_revision != PINNED_SOURCE_REVISION {
        return Err("production snapshot revision pin diverged".to_string());
    }
    if snapshot.continued_currentness_guaranteed {
        return Err("a fixed snapshot cannot claim correspondence to later revisions".to_string());
    }

    let profile = snapshot.profile;
    if profile.challenge_min_entropy_bits == 0 || profile.digest_bits == 0 {
        return Err("challenge and digest widths must be positive".to_string());
    }
    if !profile.wallet.inverse_rate.is_power_of_two()
        || profile.wallet.queries == 0
        || profile.wallet.radius_numerator == 0
        || profile.wallet.radius_numerator >= profile.wallet.radius_denominator
        || profile.wallet.field_bad_numerator == 0
        || profile.wallet.query_seed_lanes == 0
    {
        return Err("wallet snapshot parameters are invalid".to_string());
    }
    if !profile.history.inverse_rate.is_power_of_two()
        || profile.history.queries == 0
        || profile.history.joint_sidecar_groups == 0
    {
        return Err("History snapshot parameters are invalid".to_string());
    }
    if profile.poseidon2b.state_width == 0
        || profile.poseidon2b.rate_lanes == 0
        || profile.poseidon2b.rate_lanes > profile.poseidon2b.state_width
        || profile.poseidon2b.sbox_exponent == 0
        || profile.poseidon2b.full_rounds == 0
        || profile.poseidon2b.partial_rounds == 0
    {
        return Err("Poseidon2b snapshot parameters are invalid".to_string());
    }

    let correspondence = snapshot.correspondence;
    if correspondence.wallet_ledger_queries != correspondence.wallet_geometry_queries
        || correspondence.wallet_ledger_queries != profile.wallet.queries
    {
        return Err("wallet ledger and geometry query counts diverged".to_string());
    }
    if correspondence.wallet_ledger_challenge_bits != correspondence.c1_challenge_min_entropy_bits
        || correspondence.wallet_ledger_challenge_bits != profile.challenge_min_entropy_bits
    {
        return Err("wallet and C1 challenge supports diverged".to_string());
    }
    if correspondence.history_step_queries != correspondence.basefold_queries
        || correspondence.history_step_queries != profile.history.queries
    {
        return Err("HistoryStep and BaseFold query counts diverged".to_string());
    }

    let classes: [HistoryClassSnapshot; 2] =
        profile
            .history
            .classes
            .try_into()
            .map_err(|classes: Vec<_>| {
                format!("expected two History classes, found {}", classes.len())
            })?;
    let history_classes = [
        checked_history_class(classes[0].to_owned(), profile.history.inverse_rate)?,
        checked_history_class(classes[1].to_owned(), profile.history.inverse_rate)?,
    ];
    if history_classes[0].tier != 25 || history_classes[1].tier != 255 {
        return Err("canonical History classes must be ordered B25 then B255".to_string());
    }

    let history_max_algebraic_roots = 1u32
        .checked_shl(
            profile
                .history
                .zerocheck_k_skip
                .checked_add(1)
                .ok_or_else(|| "zerocheck root exponent overflowed".to_string())?,
        )
        .and_then(|value| value.checked_sub(1))
        .ok_or_else(|| "zerocheck root bound does not fit u32".to_string())?;
    let history_joint_sidecar_roots = profile
        .history
        .joint_sidecar_groups
        .checked_mul(
            u32::try_from(profile.poseidon2b.state_width)
                .map_err(|_| "Poseidon2b state width does not fit u32".to_string())?,
        )
        .ok_or_else(|| "joint sidecar root bound does not fit u32".to_string())?;

    Ok(ProductionParameters {
        source_repository: snapshot.source_repository,
        source_revision: snapshot.source_revision,
        challenge_min_entropy_bits: profile.challenge_min_entropy_bits,
        digest_bits: profile.digest_bits,
        wallet_inverse_rate: profile.wallet.inverse_rate,
        wallet_queries: profile.wallet.queries,
        wallet_radius_numerator: profile.wallet.radius_numerator,
        wallet_radius_denominator: profile.wallet.radius_denominator,
        wallet_field_bad_numerator: profile.wallet.field_bad_numerator,
        wallet_query_seed_lanes: profile.wallet.query_seed_lanes,
        history_inverse_rate: profile.history.inverse_rate,
        history_queries: profile.history.queries,
        history_classes,
        history_max_algebraic_roots,
        history_joint_sidecar_roots,
        poseidon_state_width: profile.poseidon2b.state_width,
        poseidon_rate_lanes: profile.poseidon2b.rate_lanes,
        poseidon_sbox_exponent: profile.poseidon2b.sbox_exponent,
        poseidon_full_rounds: profile.poseidon2b.full_rounds,
        poseidon_partial_rounds: profile.poseidon2b.partial_rounds,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_is_pinned_to_the_declared_revision() {
        let parameters = ProductionParameters::load().unwrap();
        assert_eq!(parameters.source_repository, PINNED_SOURCE_REPOSITORY);
        assert_eq!(parameters.source_revision, PINNED_SOURCE_REVISION);
        assert_eq!(parameters.source_revision.len(), 40);
        assert!(
            parameters
                .source_revision
                .bytes()
                .all(|byte| byte.is_ascii_hexdigit())
        );
    }

    #[test]
    fn production_profile_is_w65_h133() {
        let parameters = ProductionParameters::load().unwrap();
        assert_eq!(parameters.challenge_min_entropy_bits, 255);
        assert_eq!(parameters.digest_bits, 256);
        assert_eq!(parameters.wallet_inverse_rate, 32);
        assert_eq!(parameters.wallet_queries, 65);
        assert_eq!(
            (
                parameters.wallet_radius_numerator,
                parameters.wallet_radius_denominator,
            ),
            (49, 64)
        );
        assert_eq!(parameters.wallet_field_bad_numerator, 29_163_918_888);
        assert_eq!(parameters.wallet_query_seed_lanes, 7);
        assert_eq!(parameters.history_inverse_rate, 4);
        assert_eq!(parameters.history_queries, 133);
        assert_eq!(parameters.history_max_algebraic_roots, 127);
        assert_eq!(parameters.history_joint_sidecar_roots, 36);
    }

    #[test]
    fn both_recursive_history_classes_are_covered() {
        let classes = ProductionParameters::load().unwrap().history_classes;
        assert_eq!(classes[0].tier, 25);
        assert_eq!(classes[0].message_log2, 17);
        assert_eq!(classes[0].codeword_log2, 19);
        assert_eq!(classes[0].codeword_len, 1 << 19);
        assert_eq!(classes[0].inverse_rate, 4);
        assert_eq!(classes[0].plaintext_tail_len, 128);
        assert_eq!(classes[0].fri_arities, [4, 4, 4, 4, 1]);
        assert_eq!(classes[1].tier, 255);
        assert_eq!(classes[1].message_log2, 19);
        assert_eq!(classes[1].codeword_log2, 21);
        assert_eq!(classes[1].codeword_len, 1 << 21);
        assert_eq!(classes[1].inverse_rate, 4);
        assert_eq!(classes[1].plaintext_tail_len, 512);
        assert_eq!(classes[1].fri_arities, [4, 4, 4, 4, 3]);
    }

    #[test]
    fn fixed_poseidon2b_profile_is_snapshotted() {
        let parameters = ProductionParameters::load().unwrap();
        assert_eq!(parameters.poseidon_state_width, 4);
        assert_eq!(parameters.poseidon_rate_lanes, 2);
        assert_eq!(parameters.poseidon_sbox_exponent, 7);
        assert_eq!(parameters.poseidon_full_rounds, 8);
        assert_eq!(parameters.poseidon_partial_rounds, 58);
    }

    #[test]
    fn correspondence_mismatch_is_rejected() {
        let diverged =
            PRODUCTION_SNAPSHOT.replace("basefold_queries = 133", "basefold_queries = 132");
        assert!(load_snapshot(&diverged).is_err());
    }
}
