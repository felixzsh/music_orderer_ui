import { Download, X } from 'lucide-react';
import { useContext, useState } from 'react';
import { PendingRequestsContext } from './PendingRequestsContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { HierarchicalSongList } from './HierarchicalSongList';
import { SongGroup } from '../types/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface SongPreviewProps {
  songGroups: { [key: string]: SongGroup };
  totalSongs: number;
  onDeleteSong: (songId: string) => void;
  onMoveSong: (songId: string, sourceTag: string, destTag: string, newIndex: number) => void;
  onSendRequest: (deliveryType: 'DIGITAL_LINK' | 'PHYSICAL_USB', usbSource: 'internal' | 'external') => void;
  onDeleteGroup: (groupName: string) => void;
  onReSearch: (songId: string) => void;
  onUpdateSong: (songId: string, updates: { title?: string; artist?: string }) => void;
  phoneNumber: string;
  isAdmin?: boolean;
}

export function SongPreview({ 
  songGroups, 
  totalSongs, 
  onDeleteSong, 
  onMoveSong, 
  onSendRequest, 
  onDeleteGroup,
  onReSearch,
  onUpdateSong,
  phoneNumber,
  isAdmin = false
}: SongPreviewProps) {
  const { pending, cancelAll, skipCount, resetSkips } = useContext(PendingRequestsContext);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'DIGITAL_LINK' | 'PHYSICAL_USB'>('DIGITAL_LINK');
  const [usbSource, setUsbSource] = useState<'internal' | 'external'>('internal');

  const openDeliveryDialog = () => {
    setDeliveryType('DIGITAL_LINK');
    setUsbSource('internal');
    setIsDeliveryDialogOpen(true);
  };

  const handleConfirmSend = () => {
    setIsDeliveryDialogOpen(false);
    onSendRequest(deliveryType, deliveryType === 'PHYSICAL_USB' ? usbSource : 'internal');
  };
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>Preview</span>
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            {totalSongs} cancion{totalSongs !== 1 ? 'es' : ''}
            {pending > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold flex items-center gap-1">
                busquedas en cola: {pending}
                <button
                  onClick={cancelAll}
                  className="ml-1 hover:text-red-600 transition-colors"
                  title="Cancelar todas las búsquedas"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {skipCount > 0 && (
              <span
                className="ml-2 px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-orange-200 transition-colors"
                onClick={resetSkips}
                title="Limpiar contador de duplicados"
              >
                duplicados: {skipCount}
                <X className="h-3 w-3" />
              </span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <HierarchicalSongList
            songGroups={songGroups}
            onDeleteSong={onDeleteSong}
            onMoveSong={onMoveSong}
            onDeleteGroup={onDeleteGroup}
            onReSearch={onReSearch}
            onUpdateSong={onUpdateSong}
          />
        </ScrollArea>
        {totalSongs > 0 && (
          <div className="flex-shrink-0 mt-4 pt-4 border-t">
            <Button 
              onClick={() => {
                if (isAdmin || phoneNumber.startsWith('521899')) {
                  openDeliveryDialog();
                } else {
                  onSendRequest('DIGITAL_LINK', 'internal');
                }
              }}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Enviar Request
            </Button>

            <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Cómo quieres recibir tu paquete musical?</DialogTitle>
                  <DialogDescription>
                    Selecciona el método de entrega que prefieres
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  <div>
                    <Label className="text-sm font-medium">Entrega</Label>
                    <RadioGroup
                      value={deliveryType}
                      onValueChange={(v) => setDeliveryType(v as 'DIGITAL_LINK' | 'PHYSICAL_USB')}
                      className="mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="DIGITAL_LINK" id="delivery-digital" />
                        <Label htmlFor="delivery-digital">Link de descarga</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="PHYSICAL_USB" id="delivery-usb" />
                        <Label htmlFor="delivery-usb">USB físico</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">USB</Label>
                    <RadioGroup
                      value={usbSource}
                      onValueChange={(v) => setUsbSource(v as 'internal' | 'external')}
                      disabled={deliveryType !== 'PHYSICAL_USB'}
                      className="mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="internal" id="usb-internal" />
                        <Label htmlFor="usb-internal">USB interno — nuestro propio</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="external" id="usb-external" />
                        <Label htmlFor="usb-external">USB externo — tu propia USB</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmSend}>
                    Confirmar pedido
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}