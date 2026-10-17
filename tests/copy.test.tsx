import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

/** Stands for the engine's own drawing of a reply block: its text. */
function engineDraws(on: On): void {
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.text}</Text>
  })
}

const reply = { text: 'Готово: **3 файла** изменено.', isFirstOfReply: true } as const

test('a press copies the block text verbatim and says so', async ($, on) => {
  engineDraws(on)
  const copied: string[] = []
  on('ui.copy', ($, e) => (copied.push(e.text), { value: { isCopied: true } }))
  const toasts: string[] = []
  on('ui.toast', ($, e) => (toasts.push(e.text), { value: undefined }))

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'copy-reply', surface, component: 'AssistantMessage', props: reply })
    expect(await ui.find({ type: 'Text', text: /Готово/ })).toBeDefined()
    await ui.press({ key: 'copy' })
    await ui.unmount()
  }
  expect(copied).toEqual([reply.text, reply.text])
  expect(toasts).toEqual(['Ответ скопирован', 'Ответ скопирован'])
})

test('a failed copy says why', async ($, on) => {
  engineDraws(on)
  on('ui.copy', () => ({ value: { isCopied: false, reason: 'no-clipboard' } }))
  const toasts: string[] = []
  on('ui.toast', ($, e) => (toasts.push(e.text), { value: undefined }))

  const ui = await $.ui.mount({ plugin: 'copy-reply', surface: 'terminal', component: 'AssistantMessage', props: reply })
  await ui.press({ key: 'copy' })
  expect(toasts).toEqual(['Не скопировано: терминал не дал доступа к буферу обмена'])
})

test('a summary block gets no button', async ($, on) => {
  engineDraws(on)
  const ui = await $.ui.mount({
    plugin: 'copy-reply',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: 'Read 3 files', isFirstOfReply: false, isSummary: true },
  })
  expect(await ui.find({ type: 'Button' })).toBeUndefined()
})
