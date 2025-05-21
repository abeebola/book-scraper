import { PrimaryGeneratedColumn } from 'typeorm';
import { AbstractDto } from './dto';

export abstract class BaseAbstractEntity<T extends AbstractDto = AbstractDto> {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  abstract dtoClass: new (entity: BaseAbstractEntity, options?: any) => T;
  toDto(...args: any[]): T {
    return new this.dtoClass(this, ...args);
  }
}

export abstract class AbstractEntity<
  T extends AbstractDto = AbstractDto,
> extends BaseAbstractEntity<T> {
  abstract deletedAt?: Date;
}
