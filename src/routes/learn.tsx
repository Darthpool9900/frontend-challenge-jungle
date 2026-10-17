import {createFileRoute,Link} from '@tanstack/react-router'
import {Shell} from '@/kurio/Shell'
export const Route=createFileRoute('/learn')({component:Learn})
// eslint-disable-next-line react-refresh/only-export-components
function Learn(){return <Shell><div className="simple-page"><h1>Aprenda com a Kurio</h1><h2>O que são NFTs?</h2><p>NFTs são tokens não fungíveis que representam itens digitais únicos, com registro em uma blockchain. Confira a edição, os atributos e a procedência de cada obra antes de comprar.</p><h2>Como comprar?</h2><p>Encontre uma obra, escolha a edição e a quantidade, adicione ao carrinho, conecte uma carteira simulada e confira os valores no checkout.</p><h2>Carteira e segurança</h2><p>Nesta demonstração, as carteiras e os pagamentos são simulados. Nunca informe a frase de recuperação ou chave privada em formulários.</p><Link to="/" className="primary">Explorar NFTs</Link></div></Shell>}
