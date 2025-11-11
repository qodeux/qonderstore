import { Alert, cn, type AlertProps } from '@heroui/react'
import { icons } from 'lucide-react'
import { forwardRef, useMemo } from 'react'

type IconName = keyof typeof icons

type CustomAlertProps = Omit<AlertProps, 'icon'> & {
  /** Nombre del ícono de lucide, p.ej. 'AlertCircle', 'CheckCircle2' */
  iconName?: IconName
  /** Props extra para el SVG del ícono (tamaños, clase, etc.) */
  iconProps?: React.SVGProps<SVGSVGElement>
}

const CustomAlert = forwardRef<HTMLDivElement, CustomAlertProps>(
  ({ title, children, variant = 'faded', color = 'secondary', className, classNames = {}, iconName, iconProps, ...props }, ref) => {
    const colorClass = useMemo(() => {
      switch (color) {
        case 'default':
          return 'before:bg-default-300'
        case 'primary':
          return 'before:bg-primary'
        case 'secondary':
          return 'before:bg-secondary'
        case 'success':
          return 'before:bg-success'
        case 'warning':
          return 'before:bg-warning'
        case 'danger':
          return 'before:bg-danger'
        default:
          return 'before:bg-default-200'
      }
    }, [color])

    const IconCmp = iconName ? icons[iconName] : undefined

    return (
      <Alert
        ref={ref}
        classNames={{
          ...classNames,
          base: cn(
            [
              'bg-default-50 dark:bg-background shadow-sm',
              'border-1 border-default-200 dark:border-default-100',
              "relative before:content-[''] before:absolute before:z-10",
              'before:left-0 before:top-[-1px] before:bottom-[-1px] before:w-1',
              'rounded-l-none border-l-0',
              colorClass
            ],
            classNames?.base,
            className
          ),
          title: cn('font-semibold text-lg', classNames?.title),
          mainWrapper: cn('pt-1 ', classNames?.mainWrapper),
          iconWrapper: cn('dark:bg-transparent p-6', classNames?.iconWrapper),
          alertIcon: cn('fill-none', classNames?.alertIcon)
        }}
        color={color}
        title={title}
        variant={variant}
        icon={IconCmp ? <IconCmp {...iconProps} /> : undefined}
        {...props}
      >
        {children}
      </Alert>
    )
  }
)

CustomAlert.displayName = 'CustomAlert'
export default CustomAlert
