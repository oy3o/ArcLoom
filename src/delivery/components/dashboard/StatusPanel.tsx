import React from 'react';
import { Player } from '@/domain';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const StatBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (<div className="flex justify-between items-center text-sm mb-1"><span className="text-gray-400">{label}</span><span className="font-mono font-bold text-purple-300">{value}</span></div>);

export const StatusPanel: React.FC<{ player: Player }> = ({ player }) => (
    <div className="space-y-4">
        <Card><CardHeader><CardTitle className="text-2xl text-center text-purple-300">{player.name || "无名之人"}</CardTitle><p className="text-center text-gray-400 text-sm">等级 {player.level}</p></CardHeader></Card>
        <Card>
            <CardHeader><CardTitle>当前权能</CardTitle></CardHeader>
            <CardContent>
                {player.currentPower ? (<div><h3 className="font-bold text-lg text-cyan-300">{`序列 ${player.currentPower.sequence}: ${player.currentPower.name}`}</h3><p className="text-sm text-gray-400 mb-2">{player.currentPower.domain}</p><p className="text-sm italic mb-3">"{player.currentPower.description}"</p><h4 className="font-semibold mb-1 pt-2">能力:</h4><ul className="list-disc list-inside text-sm space-y-1">{player.currentPower.abilities?.map((ability, i) => <li key={i}>{ability}</li>)}</ul></div>) : (<p className="text-gray-500 italic">尚未觉醒权能。</p>)}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>属性</CardTitle></CardHeader>
            <CardContent>
                {player.stats && Object.keys(player.stats).length > 0 ? (Object.entries(player.stats).map(([name, value]) => (<StatBar key={name} label={name} value={value} />))) : (<p className="text-gray-500 italic text-sm">无可用属性。</p>)}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>物品栏</CardTitle></CardHeader>
            <CardContent>
                {(player.inventory && player.inventory.length > 0) ? (<ul className="space-y-2">{player.inventory.map(item => (<li key={item.id} className="text-sm">{item.name}</li>))}</ul>) : (<p className="text-gray-500 italic text-sm">空</p>)}
            </CardContent>
        </Card>
    </div>
);
