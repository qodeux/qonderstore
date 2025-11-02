'use client'

import type { ButtonProps } from '@heroui/react'
import { cn } from '@heroui/react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import type { ComponentProps } from 'react'
import React from 'react'
import { flushSync } from 'react-dom'
import { useDispatch } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import { setWizardNavDir } from '../../../store/slices/uiSlice'

export type RowStepProps = {
  title?: React.ReactNode
  className?: string
}

export interface RowStepsProps extends React.HTMLAttributes<HTMLButtonElement> {
  steps?: RowStepProps[]
  color?: ButtonProps['color']
  hideProgressBars?: boolean
  className?: string
  stepClassName?: string
  onStepChange?: (stepIndex: number) => void
  allowAllSteps?: boolean
}

function CheckIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
      <m.path
        animate={{ pathLength: 1 }}
        d='M5 13l4 4L19 7'
        initial={{ pathLength: 0 }}
        strokeLinecap='round'
        strokeLinejoin='round'
        transition={{ delay: 0.2, type: 'tween', ease: 'easeOut', duration: 0.3 }}
      />
    </svg>
  )
}

const RowSteps = React.forwardRef<HTMLButtonElement, RowStepsProps>(
  (
    { color = 'primary', steps = [], onStepChange, hideProgressBars = false, stepClassName, className, allowAllSteps = false, ...props },
    ref
  ) => {
    const dispatch = useDispatch()
    const { activeStep, goToStep } = useWizard()

    const handleClick = (stepIndex: number) => {
      // Solo permitir saltar hacia atrás (completados) a menos que esté permitido todo
      if (!allowAllSteps && stepIndex > activeStep) return

      const dir = Math.sign(stepIndex - activeStep) as -1 | 0 | 1
      if (dir !== 0) {
        // marca la intención ANTES de cambiar de paso
        flushSync(() => dispatch(setWizardNavDir(dir)))
      }

      goToStep(stepIndex)
      onStepChange?.(stepIndex)
    }

    const colors = React.useMemo(() => {
      let userColor: string
      let fgColor: string

      const colorsVars = [
        '[--active-fg-color:var(--step-fg-color)]',
        '[--active-border-color:var(--step-color)]',
        '[--active-color:var(--step-color)]',
        '[--complete-background-color:var(--step-color)]',
        '[--complete-border-color:var(--step-color)]',
        '[--inactive-border-color:hsl(var(--heroui-default-300))]',
        '[--inactive-color:hsl(var(--heroui-default-300))]'
      ]

      switch (color) {
        case 'secondary':
          userColor = '[--step-color:hsl(var(--heroui-secondary))]'
          fgColor = '[--step-fg-color:hsl(var(--heroui-secondary-foreground))]'
          break
        case 'success':
          userColor = '[--step-color:hsl(var(--heroui-success))]'
          fgColor = '[--step-fg-color:hsl(var(--heroui-success-foreground))]'
          break
        case 'warning':
          userColor = '[--step-color:hsl(var(--heroui-warning))]'
          fgColor = '[--step-fg-color:hsl(var(--heroui-warning-foreground))]'
          break
        case 'danger':
          userColor = '[--step-color:hsl(var(--heroui-error))]'
          fgColor = '[--step-fg-color:hsl(var(--heroui-error-foreground))]'
          break
        case 'default':
          userColor = '[--step-color:hsl(var(--heroui-default))]'
          fgColor = '[--step-fg-color:hsl(var(--heroui-default-foreground))]'
          break
        case 'primary':
        default:
          userColor = '[--step-color:hsl(var(--heroui-primary))]'
          fgColor = '[--step-fg-color:hsl(var(--heroui-primary-foreground))]'
          break
      }

      if (!className?.includes('--step-fg-color')) colorsVars.unshift(fgColor)
      if (!className?.includes('--step-color')) colorsVars.unshift(userColor)
      if (!className?.includes('--inactive-bar-color')) colorsVars.push('[--inactive-bar-color:hsl(var(--heroui-default-300))]')

      return colorsVars
    }, [color, className])

    return (
      <section className='flex flex-col items-center '>
        <nav aria-label='Progress' className='-my-4 max-w-fit overflow-x-auto py-4'>
          <ol className={cn('flex flex-row flex-nowrap ', colors, className)}>
            {steps?.map((step, stepIdx) => {
              const status = activeStep === stepIdx ? 'active' : activeStep < stepIdx ? 'inactive' : 'complete'

              return (
                <li key={stepIdx} className='relative flex w-full items-center pr-12 last:pr-0' aria-label={`${step.title}`}>
                  <button
                    ref={ref}
                    aria-current={status === 'active' ? 'step' : undefined}
                    className={cn(
                      'group rounded-large flex w-full cursor-pointer flex-row items-center justify-center py-2.5',
                      stepClassName
                    )}
                    onClick={() => handleClick(stepIdx)}
                    {...props}
                  >
                    <div className='h-ful relative flex items-center'>
                      <LazyMotion features={domAnimation}>
                        <m.div animate={status} className='relative'>
                          <m.div
                            className={cn(
                              'border-medium text-large text-default-foreground relative flex h-[34px] w-[34px] items-center justify-center rounded-full font-semibold',
                              { 'shadow-lg': status === 'complete' }
                            )}
                            initial={false}
                            transition={{ duration: 0.25 }}
                            variants={{
                              inactive: {
                                backgroundColor: 'transparent',
                                borderColor: 'var(--inactive-border-color)',
                                color: 'var(--inactive-color)'
                              },
                              active: {
                                backgroundColor: 'transparent',
                                borderColor: 'var(--active-border-color)',
                                color: 'var(--active-color)'
                              },
                              complete: {
                                backgroundColor: 'var(--complete-background-color)',
                                borderColor: 'var(--complete-border-color)'
                              }
                            }}
                          >
                            <div className='flex items-center justify-center'>
                              {status === 'complete' ? (
                                <CheckIcon className='h-6 w-6 text-(--active-fg-color)' />
                              ) : (
                                <span>{stepIdx + 1}</span>
                              )}
                            </div>
                          </m.div>
                        </m.div>
                      </LazyMotion>
                    </div>

                    <div className='max-w-full flex-1 text-start'>
                      <div
                        className={cn(
                          'text-small text-default-foreground lg:text-medium font-medium transition-[color,opacity] duration-300 group-active:opacity-80',
                          { 'text-default-500': status === 'inactive' }
                        )}
                      >
                        {/* {step.title} */}
                      </div>
                    </div>

                    {stepIdx < steps.length - 1 && !hideProgressBars && (
                      <div
                        aria-hidden='true'
                        className='pointer-events-none absolute right-0 w-12 flex-none items-center'
                        style={{ '--idx': stepIdx } as React.CSSProperties}
                      >
                        <div
                          className={cn(
                            'relative h-0.5 w-full bg-(--inactive-bar-color) transition-colors duration-300',
                            "after:absolute after:block after:h-full after:w-0 after:bg-(--active-border-color) after:transition-[width] after:duration-300 after:content-['']",
                            { 'after:w-full': stepIdx < activeStep }
                          )}
                        />
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <footer className={`text-${color} font-bold text-center text-lg`}>{steps[activeStep]?.title}</footer>
      </section>
    )
  }
)

RowSteps.displayName = 'RowSteps'
export default RowSteps
