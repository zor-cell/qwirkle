var Module = {
    wasmBinaryFile: 'wasm/opencv_js.wasm',
    usingWasm: true,
    onRuntimeInitialized: () => {cvReady = true}
};