import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type EmbedBuilder } from 'discord.js';
import { COLORS, ComponentId } from '../config/constants';
import { brandEmbed } from '../utils/embeds';

export interface PanelMessage {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

function buttonRow(button: ButtonBuilder): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
}

export function buildAuthPanel(): PanelMessage {
  return {
    embeds: [
      brandEmbed(COLORS.success)
        .setTitle('✅ 서버 인증')
        .setDescription(
          [
            '아래 버튼을 눌러 서버 인증을 완료해 주세요.',
            '',
            '인증을 완료하면 서버의 모든 채널을 이용할 수 있습니다.',
          ].join('\n'),
        ),
    ],
    components: [
      buttonRow(
        new ButtonBuilder()
          .setCustomId(ComponentId.authVerify)
          .setLabel('인증하기')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success),
      ),
    ],
  };
}

export function buildTicketPanel(): PanelMessage {
  return {
    embeds: [
      brandEmbed(COLORS.primary)
        .setTitle('🎫 고객 지원 티켓')
        .setDescription(
          [
            '문의가 필요하신가요? 아래 버튼으로 1:1 티켓을 열어 주세요.',
            '',
            '• 티켓은 본인과 담당 직원만 볼 수 있습니다.',
            '• 문의 주제와 내용을 입력하면 전용 채널이 생성됩니다.',
            '• 문의가 해결되면 티켓을 종료해 주세요.',
          ].join('\n'),
        ),
    ],
    components: [
      buttonRow(
        new ButtonBuilder()
          .setCustomId(ComponentId.ticketCreate)
          .setLabel('티켓 열기')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Primary),
      ),
    ],
  };
}

export function buildQuotePanel(): PanelMessage {
  return {
    embeds: [
      brandEmbed(COLORS.info)
        .setTitle('💼 외주 견적 문의')
        .setDescription(
          [
            'Syntax Studio에 개발 외주를 맡겨 보세요!',
            '',
            '**진행 절차**',
            '1️⃣ 아래 버튼으로 견적 요청서를 작성합니다.',
            '2️⃣ 전용 상담 채널이 생성되고 담당자가 배정됩니다.',
            '3️⃣ 상담 후 견적을 안내드리며, 확정 시 작업이 시작됩니다.',
            '4️⃣ 진행률과 결과물은 상담 채널에서 실시간으로 공유됩니다.',
          ].join('\n'),
        ),
    ],
    components: [
      buttonRow(
        new ButtonBuilder()
          .setCustomId(ComponentId.orderQuote)
          .setLabel('견적 요청하기')
          .setEmoji('💼')
          .setStyle(ButtonStyle.Success),
      ),
    ],
  };
}
