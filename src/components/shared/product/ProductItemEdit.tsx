import { Button } from '@/components/ui/button';
import { type ComponentType } from 'react'
import ProductItem from '../../../features/sales/components/ProductItem';

type WithAdminActionProps = {
    onEdit: () => void;
}

function withAdminAction<T extends object>(Component: ComponentType<T>) {
    type Props = Omit<T, keyof WithAdminActionProps> & WithAdminActionProps;

    const Wrapped = (props: Props) => {
        const { onEdit, ...rest } = props;

        return <>
            <div className='relative'>
                <Component {...(rest as T)} />
                <Button className="absolute top-0" onClick={onEdit}>edit</Button>
            </div>
        </>
    }

    return Wrapped;


}


const ProductItemEdit = withAdminAction(ProductItem)

export default ProductItemEdit
