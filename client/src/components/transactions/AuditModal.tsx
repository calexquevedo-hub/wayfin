import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

interface AuditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: (reason: string) => void;
    destructive?: boolean;
}

const AuditModal = ({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
    destructive = false
}: AuditModalProps) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim().length < 5) return;
        onConfirm(reason);
        setReason('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {destructive && <AlertTriangle className="h-5 w-5 text-destructive" />}
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="font-bold text-xs uppercase text-muted-foreground">
                            Motivo da Alteração (Obrigatório)
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Descreva brevemente o motivo desta ação..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px] rounded-xl"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Esta ação será registrada na trilha de auditoria para conformidade financeira.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        variant={destructive ? "destructive" : "default"}
                        onClick={handleConfirm}
                        disabled={reason.trim().length < 5}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AuditModal;
