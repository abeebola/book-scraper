import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity, BaseAbstractEntity } from './entity';

export class BaseAbstractDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id: string;

  constructor(entity: BaseAbstractEntity) {
    this.id = entity.id;
  }
}
export class AbstractDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id: string;

  constructor(entity: AbstractEntity) {
    this.id = entity.id;
  }
}
