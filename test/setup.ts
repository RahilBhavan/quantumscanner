import '@testing-library/jest-dom'

// Required for React 19 to enable hook dispatching in test environments
// Without this, React 19 concurrent mode doesn't activate its act() integration
// @ts-expect-error
globalThis.IS_REACT_ACT_ENVIRONMENT = true
