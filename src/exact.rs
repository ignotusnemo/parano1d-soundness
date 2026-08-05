// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Paranoid Zero.

//! Exact nonnegative rational arithmetic used by every certificate.

use std::{cmp::Ordering, fmt};

use num_bigint::BigUint;
use num_rational::Ratio;
use num_traits::{One, ToPrimitive, Zero};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ExactProbability(Ratio<BigUint>);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SecurityBits {
    ZeroUpperBound,
    TrivialUncapped,
    Exact(u64),
    Interval { lower: u64, upper_exclusive: u64 },
}

impl fmt::Display for SecurityBits {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ZeroUpperBound => formatter.write_str("zero upper bound"),
            Self::TrivialUncapped => formatter.write_str("trivial uncapped bound"),
            Self::Exact(bits) => write!(formatter, "{bits}"),
            Self::Interval {
                lower,
                upper_exclusive,
            } => write!(formatter, "[{lower}, {upper_exclusive})"),
        }
    }
}

impl PartialOrd for ExactProbability {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for ExactProbability {
    fn cmp(&self, other: &Self) -> Ordering {
        self.0.cmp(&other.0)
    }
}

impl ExactProbability {
    pub fn new(numerator: impl Into<BigUint>, denominator: impl Into<BigUint>) -> Self {
        let denominator = denominator.into();
        assert!(!denominator.is_zero(), "exact denominator must be nonzero");
        Self(Ratio::new(numerator.into(), denominator))
    }

    pub fn zero() -> Self {
        Self(Ratio::zero())
    }

    pub fn one() -> Self {
        Self(Ratio::one())
    }

    pub fn dyadic(numerator: impl Into<BigUint>, denominator_bits: u32) -> Self {
        Self::new(numerator, BigUint::one() << denominator_bits)
    }

    pub fn numerator(&self) -> &BigUint {
        self.0.numer()
    }

    pub fn denominator(&self) -> &BigUint {
        self.0.denom()
    }

    pub fn ratio(&self) -> &Ratio<BigUint> {
        &self.0
    }

    pub fn add(&self, other: &Self) -> Self {
        Self(self.0.clone() + other.0.clone())
    }

    pub fn multiply(&self, other: &Self) -> Self {
        Self(self.0.clone() * other.0.clone())
    }

    pub fn scale_integer(&self, factor: impl Into<BigUint>) -> Self {
        Self::new(self.numerator() * factor.into(), self.denominator().clone())
    }

    pub fn divide_integer(&self, divisor: impl Into<BigUint>) -> Self {
        let divisor = divisor.into();
        assert!(!divisor.is_zero(), "exact divisor must be nonzero");
        Self::new(self.numerator().clone(), self.denominator() * divisor)
    }

    pub fn multiply_by_power_of_two(&self, bits: u32) -> Self {
        Self::new(self.numerator() << bits, self.denominator().clone())
    }

    pub fn pow(&self, exponent: u32) -> Self {
        Self::new(
            self.numerator().pow(exponent),
            self.denominator().pow(exponent),
        )
    }

    pub fn cap_one(&self) -> Self {
        if self.numerator() >= self.denominator() {
            Self::one()
        } else {
            self.clone()
        }
    }

    pub fn checked_sub(&self, other: &Self) -> Option<Self> {
        (self >= other).then(|| Self(self.0.clone() - other.0.clone()))
    }

    pub fn security_bits(&self) -> SecurityBits {
        let numerator = self.numerator();
        let denominator = self.denominator();
        if numerator.is_zero() {
            return SecurityBits::ZeroUpperBound;
        }
        if numerator > denominator {
            return SecurityBits::TrivialUncapped;
        }
        if numerator == denominator {
            return SecurityBits::Exact(0);
        }

        let mut lower = denominator.bits().saturating_sub(numerator.bits());
        while (numerator << lower) > *denominator {
            lower -= 1;
        }
        while (numerator << (lower + 1)) <= *denominator {
            lower += 1;
        }
        if (numerator << lower) == *denominator {
            SecurityBits::Exact(lower)
        } else {
            SecurityBits::Interval {
                lower,
                upper_exclusive: lower + 1,
            }
        }
    }

    pub fn exact_fraction(&self) -> String {
        format!("{}/{}", self.numerator(), self.denominator())
    }

    pub fn decimal_prefix(&self, fractional_digits: usize) -> String {
        decimal_ratio_prefix(self.numerator(), self.denominator(), fractional_digits)
    }

    pub fn decimal_ceiling(&self, fractional_digits: usize) -> String {
        decimal_ratio_ceiling(self.numerator(), self.denominator(), fractional_digits)
    }

    pub fn descriptive_security_bits(&self) -> f64 {
        descriptive_log2_integer(self.denominator()) - descriptive_log2_integer(self.numerator())
    }
}

pub fn decimal_ratio_prefix(
    numerator: &BigUint,
    denominator: &BigUint,
    fractional_digits: usize,
) -> String {
    assert!(!denominator.is_zero());
    let integer = numerator / denominator;
    if fractional_digits == 0 {
        return integer.to_string();
    }
    let mut remainder = numerator % denominator;
    let mut output = format!("{integer}.");
    for _ in 0..fractional_digits {
        remainder *= 10u32;
        let digit = &remainder / denominator;
        output.push_str(&digit.to_string());
        remainder %= denominator;
    }
    output
}

pub fn decimal_ratio_ceiling(
    numerator: &BigUint,
    denominator: &BigUint,
    fractional_digits: usize,
) -> String {
    assert!(!denominator.is_zero());
    let scale = BigUint::from(10u32)
        .pow(u32::try_from(fractional_digits).expect("decimal precision must fit u32"));
    let scaled = numerator * &scale;
    let mut units = &scaled / denominator;
    if &scaled % denominator != BigUint::zero() {
        units += 1u32;
    }
    if fractional_digits == 0 {
        return units.to_string();
    }
    let digits = units.to_string();
    if digits.len() <= fractional_digits {
        return format!(
            "0.{}{}",
            "0".repeat(fractional_digits - digits.len()),
            digits
        );
    }
    let split = digits.len() - fractional_digits;
    format!("{}.{}", &digits[..split], &digits[split..])
}

pub fn descriptive_log2_integer(value: &BigUint) -> f64 {
    assert!(!value.is_zero());
    let bits = value.bits();
    if bits <= 53 {
        return value.to_u64().expect("a 53 bit integer fits u64").ilog2() as f64
            + (value.to_u64().unwrap() as f64 / (1u64 << value.to_u64().unwrap().ilog2()) as f64)
                .log2();
    }
    let shift = bits - 53;
    let leading = (value >> shift)
        .to_u64()
        .expect("the leading 53 bits fit u64");
    (shift as f64) + (leading as f64).log2()
}

pub fn descriptive_log2_ratio(numerator: &BigUint, denominator: &BigUint) -> f64 {
    descriptive_log2_integer(numerator) - descriptive_log2_integer(denominator)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_dyadic_bits_and_decimal_are_stable() {
        let probability = ExactProbability::dyadic(3u32, 128);
        assert_eq!(
            probability.security_bits(),
            SecurityBits::Interval {
                lower: 126,
                upper_exclusive: 127,
            }
        );
        assert!(probability.decimal_prefix(8).starts_with("0.00000000"));
    }

    #[test]
    fn arbitrary_size_log2_is_only_a_display_projection() {
        let value = BigUint::one() << 300usize;
        assert_eq!(descriptive_log2_integer(&value), 300.0);
    }

    #[test]
    fn decimal_ceiling_is_directed_upward() {
        let third = ExactProbability::new(1u32, 3u32);
        assert_eq!(third.decimal_prefix(3), "0.333");
        assert_eq!(third.decimal_ceiling(3), "0.334");
        assert_eq!(
            ExactProbability::new(1u32, 8u32).decimal_ceiling(3),
            "0.125"
        );
    }
}
