import { Inject, Injectable } from "@nestjs/common";
import { DataSaveManager } from "./save.service";
import { DataSource } from "typeorm";
import { Chain } from "src/config/constant";


@Injectable()
export class SolSaveService extends DataSaveManager{
    constructor(
        @Inject('sol') readonly datasource: DataSource,
    ) {
        super();
        this.chain = Chain.SOLANA;
    }
}