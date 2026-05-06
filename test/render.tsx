import { act, render } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import type React from 'react'

// React 19 requires async act() wrapping for renders
export async function renderAsync(
  ui: React.ReactElement,
  options?: RenderOptions
): Promise<RenderResult> {
  let result!: RenderResult
  await act(async () => {
    result = render(ui, options)
  })
  return result
}
