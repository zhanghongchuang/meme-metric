import { Entity } from 'typeorm';
import { SwapEntity } from './swap.entity';

@Entity('swap')
export class BscSwapEntity extends SwapEntity {}
