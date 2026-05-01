import type { FC, ReactNode } from "react";
import * as motion from 'motion/react-client'
import { slideVertical } from "@/lib/motion";



type props = {
    children: ReactNode
}

/**
 * Para animar la entrada inicial al cargar un componente de forma vertical
 */
const SlideVertical: FC<props> = ({ children }) => {
    return (
        <motion.div
            variants={slideVertical}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.6, ease: "easeOut" }}>
            {children}
        </motion.div>
    )
}

export default SlideVertical
