// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Paranoid Zero.

//! Executable soundness certificates for a source-pinned Parano1d production
//! profile.

pub mod block_tiwari;
pub mod exact;
pub mod local;
pub mod parameters;
pub mod poseidon2b_cryptanalysis;
pub mod qrom;
pub mod resource;

use block_tiwari::BlockTiwariCertificate;
use parameters::ProductionParameters;
use poseidon2b_cryptanalysis::Poseidon2bCryptanalysisAudit;
use qrom::IdealQromCertificate;
use resource::CategoryOneCertificate;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SoundnessCertificate {
    pub parameters: ProductionParameters,
    pub block_tiwari: BlockTiwariCertificate,
    pub poseidon2b_cryptanalysis: Poseidon2bCryptanalysisAudit,
    pub ideal_qrom: IdealQromCertificate,
    pub category_one: CategoryOneCertificate,
}

pub fn calculate() -> Result<SoundnessCertificate, String> {
    let parameters = ProductionParameters::load()?;
    let block_tiwari = block_tiwari::certificate(&parameters);
    let poseidon2b_cryptanalysis = poseidon2b_cryptanalysis::audit(&parameters)?;
    let ideal_qrom = qrom::certificate(&parameters);
    let category_one = resource::certificate(&parameters);
    Ok(SoundnessCertificate {
        parameters,
        block_tiwari,
        poseidon2b_cryptanalysis,
        ideal_qrom,
        category_one,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn complete_certificate_is_reproducible() {
        assert_eq!(calculate().unwrap(), calculate().unwrap());
    }
}
