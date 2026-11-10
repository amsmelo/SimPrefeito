import React from 'react';
import { TileData } from '../../types/city';
import { formatarMoeda } from '../../lib/utils';
import {
  X,
  MapPin,
  Trash2,
  Activity,
  GraduationCap,
  Droplet,
  TrendingUp,
  Building,
} from 'lucide-react';

interface TileDetailSheetProps {
  tile?: TileData;
  onFechar: () => void;
  onDemolir: (x: number, y: number) => void;
}

export const TileDetailSheet: React.FC<TileDetailSheetProps> = ({
  tile,
  onFechar,
  onDemolir,
}) => {
  if (!tile) return null;

  const construcao = tile.construcao;
  const isPublico = construcao && (construcao.custoCapital > 0 || construcao.id === 'prefeitura-historica');
  const podeDemolir = construcao && construcao.id !== 'prefeitura-historica';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 max-w-lg mx-auto p-3 animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 space-y-4">
        {/* Topo do Bottom Sheet */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {construcao ? construcao.nome : tile.terreno === 'AGUA' ? 'Rio / Preservação Permanente' : 'Terreno Disponível'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Lote ({tile.x}, {tile.y})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {construcao ? construcao.descricao : 'Lote desocupado pronto para novas obras municipais.'}
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicadores de Qualidade do Lote */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-rose-400">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Saúde</span>
            </div>
            <p className="font-bold text-white mt-1">{tile.nivelSaude}%</p>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-blue-400">
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Educação</span>
            </div>
            <p className="font-bold text-white mt-1">{tile.nivelEducacao}%</p>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Droplet className="w-3.5 h-3.5" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Saneamento</span>
            </div>
            <p className="font-bold text-white mt-1">{tile.nivelSaneamento}%</p>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Atratividade</span>
            </div>
            <p className="font-bold text-white mt-1">{tile.nivelAtratividade}%</p>
          </div>
        </div>

        {/* Informações Fiscais do Equipamento */}
        {construcao && (
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Ano de Inauguração:</span>
              <span className="font-semibold text-white">{tile.anoConstrucao || 'Fundação da Cidade'}</span>
            </div>

            {isPublico && (
              <>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Custeio de Manutenção Anual:</span>
                  <span className="font-mono font-medium text-amber-400">
                    {formatarMoeda(construcao.custeioAnual)}/ano
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Folha de Pagamento Vinculada:</span>
                  <span className="font-mono font-medium text-rose-400">
                    {formatarMoeda(construcao.folhaAnual)}/ano
                  </span>
                </div>
                {construcao.codigoAcaoPPA && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Ação do PPA Vinculada:</span>
                    <span className="font-mono text-blue-400">Ação {construcao.codigoAcaoPPA}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center text-slate-300">
              <span>Valor Venal Territorial (Base IPTU):</span>
              <span className="font-mono font-medium text-emerald-400">
                {formatarMoeda(tile.valorVenalIPTU)}
              </span>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>{tile.conectadoRua ? 'Conectado à malha viária' : 'Sem acesso à rua'}</span>
          </div>

          {podeDemolir && (
            <button
              onClick={() => {
                onDemolir(tile.x, tile.y);
                onFechar();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Demolir / Desapropriar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
