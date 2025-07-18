import { Entity } from 'typeorm';
import { SwapEntity } from './swap.entity';

@Entity('sol_swap')
export class SolSwapEntity extends SwapEntity {}
