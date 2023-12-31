import { Tensor } from "./tensor";

export class Linear {
	constructor(inFeatures, outFeatures) {
		this.weight = Tensor.$(inFeatures * outFeatures, [
			outFeatures,
			inFeatures,
		]);
		this.bias = Tensor.$(outFeatures, [outFeatures, 1]);
	}
	/**
	 * @param {Tensor} input
	 */
	forward(input) {
		return input.matmul(this.weight.T).add(this.bias.T);
	}
}

export class ReLU {
	/**
	 * @param {Tensor} input
	 */
	forward(input) {
		return input.relu();
	}
}

export class Sigmoid {
	/**
	 * @param {Tensor} input
	 */
	forward(input) {
		return input.sigmoid();
	}
}

export class Sequential {
	constructor(...layers) {
		this.layers = layers;
	}
	forward(input) {
		// console.log("hit");
		for (const layer of this.layers) {
			// if (layer instanceof Linear) {
			// 	console.log(input.shape);
			// 	console.log(layer.weight.shape);
			// }
			input = layer.forward(input);
		}
		return input;
	}
	//key="model.0.weight"
	// or key = "model.0.bias"
	// or key = "model.0.weight.indexes"
	// or key = "model.0.weight.codebook"
	// or key = "model.0.weight.weights"
	// or key = "model.0.bias.weights"
	splitStateKey(key) {
		const items = key.split(".");
		let layer, attr, subAttr;
		if (items.length === 3) {
			layer = +items[1];
			attr = items[2];
		} else if (items.length === 4) {
			layer = +items[1];
			attr = items[2];
			subAttr = items[3];

			if (subAttr === "weights") {
				subAttr = undefined;
			}
		}
		return [layer, attr, subAttr];
	}
	load(key, data, codebookSize = 256) {
		// layer is number, attr is weight or bias, sub attr indicates codebook or indexes or undefined
		const [layer, attr, subAttr] = this.splitStateKey(key);
		/** @type {Linear} */
		const modelLayer = this.layers[+layer];
		if (subAttr) {
			if (attr === "weight") {
				// then I need to set Uint8 Weights and codebook
				if (subAttr === "codebook") {
					modelLayer.weight.codebook = Tensor.$(
						data,
						[codebookSize, 1],
						"f32"
					);
				} else if (subAttr === "indexes") {
					const codebook = modelLayer.weight.codebook;
					modelLayer.weight = Tensor.$(
						data,
						[
							modelLayer.weight.shape[0],
							modelLayer.weight.shape[1],
						],
						"u8"
					);
					modelLayer.weight.codebook = codebook;
				}
			} else if (attr === "bias") {
				// then I need to set Uint8 Weights and codebook
				if (subAttr === "codebook") {
					modelLayer.bias.codebook = Tensor.$(
						data,
						[codebookSize, 1],
						"f32"
					);
				} else if (subAttr === "indexes") {
					const codebook = modelLayer.bias.codebook;
					modelLayer.bias = Tensor.$(
						data,
						[modelLayer.bias.shape[0], modelLayer.bias.shape[1]],
						"u8"
					);
					modelLayer.bias.codebook = codebook;
				}
			}
		} else {
			if (attr === "weight") {
				modelLayer.weight.data = new Float32Array(data);
			} else if (attr === "bias") {
				modelLayer.bias.data = new Float32Array(data);
			}
		}
	}
	loadStateDict(stateDict) {
		const entries = Object.entries(stateDict);
		for (let i = 0; i < entries.length; i++) {
			const [k, v] = entries[i];
			this.load(k, v.data);
		}
		return this;
	}
	get bytes() {
		let total = 0;
		for (const layer of this.layers) {
			if (layer instanceof Linear) {
				total += layer.weight.bytes + layer.bias.bytes;
			}
		}
		return total;
	}
	MB() {
		return this.bytes / 1024 ** 2;
	}
}

// const stateDict = {
// 	"model.0.weight": {
// 		data: [
// 			-0.5964540243148804, 0.7968498468399048, 0.44262516498565674,
// 			-0.41068506240844727, -0.8687646389007568, 0.6024892330169678,
// 			0.7059618234634399, -0.2701730728149414, -0.967170000076294,
// 			-0.6787517070770264,
// 		],
// 		shape: [10, 1],
// 	},
// 	"model.0.bias": {
// 		data: [
// 			0.12799763679504395, 0.8057754039764404, -0.7492038011550903,
// 			0.06400275230407715, 0.5874648094177246, -0.4054054021835327,
// 			0.7653414011001587, -0.940646767616272, -0.5114455223083496,
// 			0.29057300090789795,
// 		],
// 		shape: [10],
// 	},
// 	"model.1.weight": {
// 		data: [
// 			0.06540873646736145, -0.16841131448745728, 0.08436164259910583,
// 			0.026743710041046143, -0.26342472434043884, -0.29415634274482727,
// 			0.10269373655319214, -0.26085448265075684, -0.06177756190299988,
// 			0.03465232253074646, 0.15162968635559082, -0.19316557049751282,
// 			0.19048526883125305, 0.19737109541893005, 0.2978779971599579,
// 			0.14381268620491028, 0.2809159457683563, -0.1421709805727005,
// 			-0.12757143378257751, -0.27260446548461914, 0.14346793293952942,
// 			-0.28217169642448425, -0.05312180519104004, 0.24175509810447693,
// 			0.00905466079711914, -0.06268498301506042, 0.10789287090301514,
// 			-0.3016451299190521, -0.05312052369117737, 0.08751598000526428,
// 			0.21842560172080994, 0.15319854021072388, 0.027729928493499756,
// 			-0.06624917685985565, -0.2262226939201355, 0.2232474982738495,
// 			0.22232738137245178, 0.02530205249786377, -0.25008827447891235,
// 			-0.06763465702533722, -0.23409898579120636, 0.1267334222793579,
// 			0.15694156289100647, -0.1654355227947235, -0.2587595283985138,
// 			-0.21871234476566315, -0.09961353242397308, 0.22509923577308655,
// 			-0.02901706099510193, -0.05621969699859619, -0.2635599374771118,
// 			-0.3050476908683777, -0.2549121379852295, -0.1706610471010208,
// 			-0.23623906075954437, -0.1800754964351654, 0.19744572043418884,
// 			0.14675062894821167, -0.05940410494804382, 0.12651526927947998,
// 			-0.17666475474834442, 0.09831839799880981, -0.22985303401947021,
// 			0.17756599187850952, -0.1130087822675705, 0.1891290843486786,
// 			-0.26548218727111816, -0.20981605350971222, -0.31350207328796387,
// 			0.07238557934761047, -0.07346786558628082, -0.24916738271713257,
// 			-0.2803693413734436, -0.11638626456260681, -0.10852088034152985,
// 			-0.2913881838321686, 0.02042880654335022, 0.17410865426063538,
// 			-0.06815491616725922, 0.17956161499023438, -0.11620056629180908,
// 			-0.2791580259799957, -0.0216062068939209, -0.0888981968164444,
// 			0.18151533603668213, -0.2983430027961731, 0.2960974872112274,
// 			0.09256550669670105, -0.039671748876571655, -0.3072211742401123,
// 			0.12224060297012329, -0.23153552412986755, 0.1518631875514984,
// 			-0.2840403914451599, -0.20769037306308746, 0.02881038188934326,
// 			-0.3149650990962982, 0.2755400836467743, -0.15672869980335236,
// 			0.2641209661960602,
// 		],
// 		shape: [10, 10],
// 	},
// 	"model.1.bias": {
// 		data: [
// 			0.11304906010627747, 0.05503585934638977, -0.2912226617336273,
// 			0.21792897582054138, 0.07919761538505554, -0.301116943359375,
// 			0.033233463764190674, -0.013576805591583252, -0.04357713460922241,
// 			0.17650729417800903,
// 		],
// 		shape: [10],
// 	},
// 	"model.2.weight": {
// 		data: [
// 			-0.29515278339385986, 0.08590748906135559, 0.20777472853660583,
// 			0.07267603278160095, 0.13213220238685608, -0.26180216670036316,
// 			0.05454966425895691, 0.015489429235458374, 0.06144601106643677,
// 			0.1439705789089203,
// 		],
// 		shape: [1, 10],
// 	},
// 	"model.2.bias": {
// 		data: [-0.18932044506072998],
// 		shape: [1],
// 	},
// };

// const model = new Sequential(
// 	new Linear(1, 10),
// 	new Linear(10, 10),
// 	new Linear(10, 1)
// );

// model.loadStateDict(stateDict);

// const input = Tensor.$([1], [1, 1]);
// input.print();
// model.forward(input).print();

export {};
