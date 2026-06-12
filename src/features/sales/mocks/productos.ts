import image from '@/assets/img.jpg'
import image2 from '@/assets/test.png'
import type { Product } from '../types/sales'



export const products: Product[] = [
    {
        id: 'faja-seda',
        name: 'Faja bordada',
        category: 'Fajas',
        variants: [
            { id: '233', size: '20', stock: 3, price: 120 },
            { id: '2321', size: '40', stock: 8, price: 120 },
            { id: '232234', size: '40', stock: 8, price: 120 },
            { id: '232245', size: '40', stock: 8, price: 120 },
            { id: '232365', size: '50', stock: 5, price: 120 },
            { id: '2324', size: '20', stock: 4, price: 130 },
            { id: '23236', size: '50', stock: 5, price: 120 },
        ],
        image,
    },
    {
        id: 'faja-colombiana',
        name: 'Faja tradicional',
        category: 'Fajas',
        variants: [
            { id: 's', size: 'S', stock: 4, price: 186 },
            { id: 'm', size: 'M', stock: 6, price: 185 },
            { id: 'l', size: 'L', stock: 2, price: 190 },
        ],
        image: image2,
    },
    {
        id: 'blusa-manga-corta',
        name: 'Huipil bordado',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 10, price: 95 },
            { id: 'm', size: 'M', stock: 8, price: 95 },
        ],
        image,
    },
    {
        id: 'legging-control',
        name: 'Corte de Guatemala',
        category: 'Cortes',
        variants: [
            { id: 's', size: 'S', stock: 5, price: 140 },
            { id: 'm', size: 'M', stock: 0, price: 140 },
            { id: 'l', size: 'L', stock: 5, price: 145 },
        ],
        image,
    },
    {
        id: 'top-deportivo',
        name: 'Corte de Xela',
        category: 'Cortes',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 88 },
            { id: 'm', size: 'M', stock: 8, price: 88 },
        ],
        image: image2,
    },
    {
        id: 'body-moldeador',
        name: 'Blusa de corte',
        category: 'Blusas',
        variants: [
            { id: 'xs', size: 'XS', stock: 3, price: 210 },
            { id: 's', size: 'S', stock: 5, price: 210 },
        ],
        image,
    },
    {
        id: 'pantalones-deportivos',
        name: 'Pantalón de manta',
        category: 'Pantalones',
        variants: [
            { id: 's', size: 'S', stock: 7, price: 145 },
            { id: 'm', size: 'M', stock: 10, price: 145 },
            { id: 'l', size: 'L', stock: 4, price: 150 },
        ],
        image: image2,
    },
    {
        id: 'pantalon-culotte',
        name: 'Pantalón tradicional',
        category: 'Pantalones',
        variants: [
            { id: 's', size: 'S', stock: 8, price: 160 },
            { id: 'm', size: 'M', stock: 6, price: 160 },
        ],
        image,
    },
    {
        id: 'vestido-casual',
        name: 'Vestido típico',
        category: 'Vestidos',
        variants: [
            { id: 's', size: 'S', stock: 5, price: 220 },
            { id: 'm', size: 'M', stock: 7, price: 220 },
            { id: 'l', size: 'L', stock: 3, price: 225 },
        ],
        image: image2,
    },
    {
        id: 'camisa-blanca',
        name: 'Camisa bordada',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 12, price: 90 },
            { id: 'm', size: 'M', stock: 14, price: 90 },
            { id: 'l', size: 'L', stock: 6, price: 95 },
        ],
        image,
    },
    {
        id: 'sueter-lana',
        name: 'Suéter de lana',
        category: 'Abrigos',
        variants: [
            { id: 'm', size: 'M', stock: 4, price: 180 },
            { id: 'l', size: 'L', stock: 5, price: 180 },
        ],
        image: image2,
    },
    {
        id: 'chaqueta-cuero',
        name: 'Chaqueta de lana',
        category: 'Abrigos',
        variants: [
            { id: 'm', size: 'M', stock: 2, price: 350 },
            { id: 'l', size: 'L', stock: 3, price: 360 },
        ],
        image,
    },
    {
        id: 'falda-midi',
        name: 'Falda de corte',
        category: 'Faldas',
        variants: [
            { id: 's', size: 'S', stock: 9, price: 130 },
            { id: 'm', size: 'M', stock: 7, price: 130 },
        ],
        image: image2,
    },
    {
        id: 'blusa-encaje',
        name: 'Blusa de encaje',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 115 },
            { id: 'm', size: 'M', stock: 5, price: 115 },
        ],
        image,
    },
    {
        id: 'top-largo',
        name: 'Huipil largo',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 10, price: 98 },
            { id: 'm', size: 'M', stock: 12, price: 98 },
        ],
        image: image2,
    },
    {
        id: 'short-running',
        name: 'Falda corta',
        category: 'Faldas',
        variants: [
            { id: 's', size: 'S', stock: 8, price: 110 },
            { id: 'm', size: 'M', stock: 10, price: 110 },
        ],
        image,
    },
    {
        id: 'malla-termica',
        name: 'Cinturón tejido',
        category: 'Accesorios',
        variants: [
            { id: 's', size: 'S', stock: 5, price: 165 },
            { id: 'm', size: 'M', stock: 8, price: 165 },
            { id: 'l', size: 'L', stock: 6, price: 170 },
        ],
        image: image2,
    },
    {
        id: 'body-encaje',
        name: 'Huipil bordado',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 4, price: 190 },
            { id: 'm', size: 'M', stock: 3, price: 190 },
        ],
        image,
    },
    {
        id: 'pantalon-cargo',
        name: 'Pantalón campesino',
        category: 'Pantalones',
        variants: [
            { id: 'm', size: 'M', stock: 7, price: 175 },
            { id: 'l', size: 'L', stock: 5, price: 180 },
        ],
        image: image2,
    },
    {
        id: 'blusa-estampada',
        name: 'Blusa de corte',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 9, price: 105 },
            { id: 'm', size: 'M', stock: 8, price: 105 },
        ],
        image,
    },
    {
        id: 'faja-alta',
        name: 'Faja alta tradicional',
        category: 'Fajas',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 135 },
            { id: 'm', size: 'M', stock: 7, price: 135 },
        ],
        image: image2,
    },
    {
        id: 'faja-media',
        name: 'Faja de corte',
        category: 'Fajas',
        variants: [
            { id: 's', size: 'S', stock: 10, price: 125 },
            { id: 'm', size: 'M', stock: 4, price: 125 },
        ],
        image,
    },
    {
        id: 'corset-clasico',
        name: 'Cinturón bordado',
        category: 'Accesorios',
        variants: [
            { id: 's', size: 'S', stock: 3, price: 240 },
            { id: 'm', size: 'M', stock: 4, price: 240 },
        ],
        image: image2,
    },
    {
        id: 'pantalon-ancho',
        name: 'Pantalón ancho',
        category: 'Pantalones',
        variants: [
            { id: 'm', size: 'M', stock: 5, price: 155 },
            { id: 'l', size: 'L', stock: 6, price: 155 },
        ],
        image,
    },
    {
        id: 'top-espalda',
        name: 'Blusa de espalda',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 11, price: 99 },
            { id: 'm', size: 'M', stock: 9, price: 99 },
        ],
        image: image2,
    },
    {
        id: 'blusa-romantica',
        name: 'Huipil de flores',
        category: 'Blusas',
        variants: [
            { id: 's', size: 'S', stock: 6, price: 120 },
            { id: 'm', size: 'M', stock: 7, price: 120 },
            { id: 'l', size: 'L', stock: 4, price: 125 },
        ],
        image,
    },
]
