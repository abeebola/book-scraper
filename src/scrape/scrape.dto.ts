import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AbstractDto } from '../common/types/dto';
import { ScrapeRequestEntity } from './scrape-request.entity';

export const requestStatuses = ['pending', 'done', 'failed'] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export class ScrapeRequestDto {
  @ApiProperty({
    description: 'Theme to search for',
    example: 'Climate change',
  })
  @IsString()
  @IsNotEmpty()
  theme: string;
}

export class ScrapeRequestResponse extends AbstractDto {
  @ApiProperty({ description: 'Request status', enum: requestStatuses })
  status: RequestStatus;

  @ApiProperty({ example: 'Climate change' })
  theme: string;

  @ApiProperty({ description: 'Date created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date updated' })
  updatedAt: Date;

  constructor(entity: ScrapeRequestEntity) {
    super(entity);

    this.status = entity.status;
    this.theme = entity.theme;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}

export type EnrichDataJob = {
  requestId: string;
  theme: string;
};
