// needed as of 7.x series, see CHANGELOG of the api repo.
import '@polkadot/api-augment';
import '@polkadot/types-augment';

// import from the local node_modules
import { ApiPromise, WsProvider } from '@polkadot/api';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const optionsPromise = yargs(hideBin(process.argv)).option('endpoint', {
	alias: 'e',
	type: 'string',
	default: 'wss://rococo-rpc.polkadot.io',
	description: 'the wss endpoint. It must allow unsafe RPCs.',
	required: true
}).argv;

async function main() {
	const options = await optionsPromise;
	const provider = new WsProvider(options.endpoint);
	const api = await ApiPromise.create({ provider });

	const block = 4230000;
	api.rpc.chain.getBlockHash(block).then((hash) => {
		api.at(hash).then((historic) => {
			historic.query.mmr.rootHash().then((historic_root) => {
				api.rpc.mmr.generateProof([4220000], block, hash).then((proof) => {
					api.rpc.mmr.root(hash).then((rpc_root) => {
						if (rpc_root.toString() !== historic_root.toString()) {
							throw new Error('historic api and rpc mmr roots do not match');
						}
					});
					api.rpc.mmr.verifyProof(proof).then((result) => {
						if (!result) {
							throw new Error('proof verification is invalid');
						}
					});
					api.rpc.mmr.verifyProofStateless(historic_root, proof).then((result) => {
						if (!result) {
							throw new Error('stateless proof verification is invalid');
						}
					});
				});
			});
		});
	});
}

main().catch(console.error);
