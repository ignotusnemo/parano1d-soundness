# Native source-binding audits

The audit modules exercise the published v2.1 implementation. The installer authenticates the production revision and appends only `cfg(test)` modules. Every original production-file byte remains unchanged. The receipt records each original prefix, test module and complete compiled-file digest.

Use an isolated checkout of production revision `848209d5db75137483cb41a94b310ad11463473f`. Run the installer from this soundness repository. Set `PRODUCTION_CHECKOUT` to that checkout's absolute path.

```sh
python3 research/tools/install_v21_source_audits.py --production "$PRODUCTION_CHECKOUT" --audits research/tools/v21_audits > native-audit-source.json
```

From the isolated production checkout, run these commands in order and retain their output in `native-audit.log`:

```sh
cargo test --release --locked --lib -p noid_recursive v21_closure_audit -- --test-threads=1
cargo test --release --locked --lib -p noid-ivc-core field_circuit::tests -- --test-threads=1
cargo test --release --locked --lib -p noid_chain local_fast_commit_rejects_impossible_pow_before_state_or_tip_mutation -- --test-threads=1
cargo test --release --locked --lib -p noid_chain rejected_snapshot_terminal_leaves_canonical_headers_untouched -- --test-threads=1
cargo test --release --locked --lib -p noid_chain snapshot_correspondence_late_segment_substitution_rolls_back_every_durable_boundary -- --test-threads=1
cargo test --release --locked --lib -p noid_chain v21_closure_audit -- --test-threads=1
```

Append the line `ALL_NATIVE_SOURCE_AUDITS_PASSED` only after all six commands succeed. The source receipt verifies the six completed groups, all 33 named passing tests and the exact source digests. Interrupted commands contribute no passing group. The published run interrupted two broader expensive storage selections and used the completed focused commands above.

The four relation audits cover all three class selectors, every inactive point/value/live lane and shared-prefix data/challenge binding. They exercise eight optimization combinations and reject 4,784 individual output-coordinate corruptions. The three small State audits use real MDBX transactions and authenticated sparse staging with eight-bit fixtures. They check callback ordering, exact atomic installation and rollback after a same-length segment substitution. These State fixtures inject the terminal callback to test the acceptance interface. The source-binding proof separately identifies and checks the fixed cryptographic callback used by the node.

From the soundness repository, authenticate the receipt with:

```sh
python3 research/tools/v21_source_closure.py --production "$PRODUCTION_CHECKOUT" --native-log native-audit.log --installed-source native-audit-source.json
python3 research/tools/v21_resource_closure.py
```

The source arguments are in `docs/v2.1-source-binding-proofs.md`. The resource theorem and its exact conditions are in `docs/v2.1-resource-closure.md`.
