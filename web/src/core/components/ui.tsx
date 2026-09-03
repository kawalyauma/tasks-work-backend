import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
export function EmptyState({ title, message }: { title: string; message: string }) { return <div className="empty"><div className="empty-mark">✓</div><h3>{title}</h3><p>{message}</p></div>; }
export function Badge({ value }: { value: string }) { return <span className={`badge badge-${value}`}>{value.replaceAll('_',' ')}</span>; }
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={e=>e.stopPropagation()}><header><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={20}/></button></header>{children}</section></div>; }
export function Spinner() { return <div className="spinner" aria-label="Loading"/>; }
