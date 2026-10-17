import {createFileRoute,Link} from '@tanstack/react-router'
import {useOrders} from '@/features/orders/order.hooks'
import {AccountShell} from '@/kurio/Account'
import {eth,nftArt,displayName} from '@/kurio/visual'
export const Route=createFileRoute('/orders')({component:OrdersPage})
// eslint-disable-next-line react-refresh/only-export-components
function OrdersPage(){const orders=useOrders();return <AccountShell><h2>Minha coleção e atividade</h2><p>Confira seus NFTs adquiridos e o histórico de pedidos.</p>{!orders.data?.orders.length?<div className="empty-state">Nenhum pedido até agora. <Link to="/" className="primary">Explorar NFTs</Link></div>:<div className="orders-list">{orders.data.orders.map(o=><Link to="/order/$orderId" params={{orderId:o.id}} key={o.id} className="order-entry"><div><h3>Pedido #{o.id.slice(0,8)}</h3><small>{new Date(o.createdAt).toLocaleString('pt-BR')} · {o.items.length} edição(ões)</small><div className="order-thumbnails">{o.items.map(i=><img key={i.editionId} src={nftArt(i.nftId)} alt={displayName(i.nftId,i.name)}/>)}</div></div><div><b className="accent">{eth(o.totalEth)}</b><span className={`status-label status-${o.status}`}>{o.status}</span></div></Link>)}</div>}</AccountShell>}
