import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import image from '@/assets/test.png'
import { Badge } from "@/components/ui/badge"
import { useState, type FC } from "react"
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import type { SaleProduct } from "@/features/sales/types/sales"
import { toast } from "sonner"

type Props = {
    onClick: (ite: SaleProduct) => void;
    item: SaleProduct
}
const ProductItem: FC<Props> = ({ onClick, item }) => {
    const [isOpen, setIsOpen] = useState(false)
    const handeClick = () => {
        onClick(item)
        setIsOpen(false)
        toast.info(`se agrego al carrito ${item.name}`)
    }
    return (
        <>
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    <Card className="bg-white" onClick={() => setIsOpen(true)}>
                        <img

                            className="h-40 lg:h-50 w-full object-cover object-center  "
                            src={item.image}
                        />
                        <CardHeader>
                            <Badge variant={"secondary"}>
                                {item.category}
                            </Badge>

                            <CardTitle>
                                {item.name}
                            </CardTitle>
                            <CardDescription>
                                20 | 20
                            </CardDescription>
                        </CardHeader>

                    </Card>
                </DrawerTrigger>
                <DrawerContent className="bg-red-600">
                    <DrawerHeader className="mx-auto w-full max-w-md">
                        <DrawerTitle>Elige la talla</DrawerTitle>
                        <DrawerDescription>

                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody className="mx-auto w-full  rounded-t-[20px] bg-green-500 pt-2">
                        <div className='grid grid-cols-2'>

                            <img src={image} />
                            <p>{item.name}</p>
                        </div>
                        <div className='grid grid-cols-4 w-full justify-center items-center'>
                            <Badge variant={'secondary'} >20</Badge>
                            <Badge onClick={handeClick} >10</Badge>
                            <Badge onClick={handeClick}>40</Badge>
                            <Badge onClick={handeClick}>25</Badge>
                            <Badge onClick={handeClick}>23</Badge>
                            <Badge onClick={handeClick}>22</Badge>
                        </div>
                    </DrawerBody>
                </DrawerContent>

            </Drawer>
        </>
    )
}

export default ProductItem
