import type { Register } from 'claude-code'

const COPY = 'copy'

/** Why a copy did not reach the clipboard, in the person's words. */
const FAILURES = {
  'no-surface': 'нет окна, куда копировать',
  'no-clipboard': 'терминал не дал доступа к буферу обмена',
  refused: 'копирование запрещено другим модом',
} as const

export const register: Register = on => {
  // The engine's own drawing of the block stays; the button goes under it, at the right edge.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const drawn = await next(e)
    const text = e.props.text
    if (e.props.isSummary === true || text.trim() === '') return drawn

    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {drawn}
        <Box justifyContent="flex-end">
          <Button
            key="copy"
            label={COPY}
            plain
            dimColor
            onPress={async press => {
              const copied = await $.ui.copy({ text, surface: press.surface })
              $.ui.toast(copied.isCopied ? 'Ответ скопирован' : `Не скопировано: ${FAILURES[copied.reason]}`, {
                timeoutMs: 2_000,
              })
            }}
          >
            {/* Spaces at both edges widen the highlight a hover draws. */}
            {` ⧉ ${COPY} `}
          </Button>
        </Box>
      </Box>
    )
  })
}
