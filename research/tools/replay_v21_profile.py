#!/usr/bin/env python3
"""Replay the v2.1 parameter projection with its exact published native source."""

import argparse
import gzip
import hashlib
import io
import json
import os
import subprocess
import tarfile
import tempfile
import tomllib
from pathlib import Path

from v21_certificate import BANK, METADATA_SHA256, PRODUCTION, checked, load_inputs


def command(arguments, directory, **kwargs):
    return subprocess.run(arguments,cwd=directory,check=True,stdout=subprocess.PIPE,**kwargs).stdout


def validate_projection(observed, profile):
    classes = observed['classes']
    for c in classes:
        c['pcs']['inverse_rate'] = 1 << c['pcs']['log_inv_rate']
    checked(classes == profile['classes'], 'native class projection differs from profile')
    checked(observed['wallet'] == profile['wallet'], 'native authorization ledger differs from profile')
    checked(observed.get('keys') == [], 'unexpected additional input keys')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--production',type=Path,required=True,help='production Git repository containing the published revision')
    parser.add_argument('--observed',type=Path,help='compare a separately executed native projection instead of building')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    profile, _, profile_hash = load_inputs(root)
    source_hashes = {}
    for name, expected in profile['sourceHashes'].items():
        actual = hashlib.sha256(command(['git','show',f'{PRODUCTION}:{name}'],args.production)).hexdigest()
        checked(actual == expected,f'source digest: {name}')
        source_hashes[name] = actual
    helper = Path(__file__).with_name('v21_profile_source.rs').read_bytes()
    if args.observed:
        raw = args.observed.read_bytes()
        mode = 'separately executed native projection'
    else:
        with tempfile.TemporaryDirectory(prefix='noid-v21-source-') as temporary:
            directory = Path(temporary)
            source = directory/'production'
            source.mkdir()
            archive = command(['git','archive','--format=tar',PRODUCTION],args.production)
            checked(len(archive) <= 128*1024*1024,'production source archive limit')
            with tarfile.open(fileobj=io.BytesIO(archive)) as stream:
                stream.extractall(source,filter='data')
            harness = directory/'harness'
            (harness/'src').mkdir(parents=True)
            (harness/'src/main.rs').write_bytes(helper)
            dependencies = '\n'.join(f'{name} = {{ path = "../production/{name}" }}' for name in ['noid_miner','noid_recursive','noid_gkr','noid_poseidon2b'])
            manifest = f'''[package]
name = "noid-v21-certificate-projection"
version = "0.0.0"
edition = "2024"
[workspace]
[dependencies]
{dependencies}
noid_ivc_core = {{ package = "noid-ivc-core", path = "../production/noid_ivc_core" }}
serde_json = "1"
[profile.dev]
debug = 0
incremental = false
[profile.dev.package.noid_poseidon2b]
opt-level = 3
[profile.dev.package.noid_core]
opt-level = 3
'''
            (harness/'Cargo.toml').write_text(manifest)
            lock = (source/'Cargo.lock').read_bytes()
            (harness/'Cargo.lock').write_bytes(lock)
            environment = {**os.environ,'CARGO_BUILD_JOBS':'1','RAYON_NUM_THREADS':'1'}
            # Cargo adjusts the root package. Verify every retained third-party
            # package against the production lock before compiling any code.
            command(['cargo','metadata','--offline','--format-version','1'],harness,env=environment)
            original = tomllib.loads(lock.decode())['package']
            frozen = {(p['name'],p['version'],p.get('source')):p.get('checksum') for p in original}
            for package in tomllib.loads((harness/'Cargo.lock').read_text())['package']:
                if package.get('source'):
                    key = (package['name'],package['version'],package['source'])
                    checked(key in frozen and frozen[key] == package.get('checksum'),'dependency differs from production lock')
            metadata = directory/'metadata.bin'
            metadata.write_bytes(gzip.decompress((root/'research/certificates/v2.1.0/v21-runtime-metadata.bin.gz').read_bytes()))
            raw = command(['cargo','run','--locked','--offline','--',str(metadata),BANK],harness,env=environment)
        mode = 'isolated native projection from the published production Git archive'
    observed = json.loads(raw)
    validate_projection(observed,profile)
    print(json.dumps({'schemaVersion':1,'productionCommit':PRODUCTION,'profileSha256':profile_hash,
                      'metadataSha256':METADATA_SHA256,'nativeOutputSha256':hashlib.sha256(raw).hexdigest(),
                      'helperSha256':hashlib.sha256(helper).hexdigest(),'sourceHashes':source_hashes,
                      'mode':mode,'classes':observed['classes'],'wallet':observed['wallet'],
                      'comparison':'all native class and authorization fields match'},sort_keys=True,indent=2))


if __name__ == '__main__': main()
