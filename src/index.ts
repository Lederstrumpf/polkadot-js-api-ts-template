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
			historic.query.mmr.rootHash().then((root) => {
				api.rpc.mmr.generateProof([4220000], block, hash).then((proof) => {
					api.rpc.mmr.verifyProof(proof).then((result) => {
						console.log(result);
					});
					api.rpc.mmr.verifyProofStateless(root, proof).then((result) => {
						console.log(result);
					});
				});
			});
		});
	});
}

main().catch(console.error);
