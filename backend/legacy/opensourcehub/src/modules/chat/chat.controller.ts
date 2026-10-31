import { Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { ChatService } from './chat.service';
import { MarkReadDto, SendMessageDto, StartConversationDto } from './dto/chat.dto';

/**
 * Private 1:1 chat. Every route requires a signed-in user, and the service
 * checks membership of the conversation before reading or writing anything.
 */
@Controller('api/chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(@Inject(ChatService) private readonly chat: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chat.listConversations(user.id);
  }

  @Post('conversations')
  @RateLimit({ limit: 60, windowSeconds: 3600, scope: 'user', name: 'chat-start' })
  startConversation(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(StartConversationDto) body: StartConversationDto) {
    return this.chat.startConversation(user.id, body.username);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Query('after') after?: string,
  ) {
    return this.chat.getMessages(id, user.id, {
      limit: limit ? Number(limit) : undefined,
      before,
      after,
    });
  }

  @Post('conversations/:id/messages')
  @RateLimit({ limit: 120, windowSeconds: 60, scope: 'user', name: 'chat-send' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ValidatedBody(SendMessageDto) body: SendMessageDto,
  ) {
    return this.chat.sendMessage(id, user.id, body);
  }

  @Post('conversations/:id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @ValidatedBody(MarkReadDto) body: MarkReadDto) {
    return this.chat.markRead(id, user.id, body.messageIds);
  }
}
