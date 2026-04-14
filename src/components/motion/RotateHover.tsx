import type { FC, ReactNode } from "react";
import * as motion from 'motion/react-client'


type props = {
    children: ReactNode,
    rotate?: number;
}

/**
 * Para animar la posicion de un elemento al pasar el mouse
 */
const RotateHover: FC<props> = ({ children, rotate = 1 }) => {
    return (
        <motion.div whileHover={{ rotate }} >
            {children}
        </motion.div>
    )
}

export default RotateHover
