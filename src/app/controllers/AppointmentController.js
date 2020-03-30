import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';

import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';

import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    return res.json(
      await Appointment.findAll({
        where: {
          user_id: req.userId,
          canceled_at: null,
        },
        order: ['date'],
        attributes: ['id', 'date'],
        limit: 20,
        offset: (page - 1) * 20,
        include: [
          {
            model: User,
            as: 'provider',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['path', 'url'],
              },
            ],
          },
        ],
      })
    );
  }
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: 'Validação dos dados falhou!' });
    }

    const { provider_id, date } = req.body;

    /**
     * Verifica se é um prestador
     **/
    const prestador = await User.findOne({
      where: { id: provider_id, provider: true },
    });
    if (!prestador) {
      return res.status(401).json({
        erro: 'Você só pode criar agendamentos com Prestadores.',
      });
    }

    /**
     * Verifica se um prestador está marcando um horaio com o próprio.
     **/
    if (prestador.id === req.userId) {
      return res.status(401).json({
        erro: 'Você não pode agendar um horario com você.',
      });
    }
    /**
     * verifica agendamento no passado.
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({
        erro: 'Datas no passado não são permitidas.',
      });
    }

    /**
     * Verifica se a data horário está disponivel.
     */

    if (
      await Appointment.findOne({
        where: {
          provider_id,
          canceled_at: null,
          date: hourStart,
        },
      })
    ) {
      return res.status(400).json({
        erro: 'Data de agendamento não disponivel.',
      });
    }
    /**
     * Notificar prestador de serviço
     */

    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );

    console.log('----------------------------');
    await Notification.create({
      content: `Novo agendamento de ${user.name}para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(
      await Appointment.create({
        user_id: req.userId,
        provider_id,
        date: hourStart,
      })
    );
  }
  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        erro: 'Você não possui permição para cancelar este agendamento.',
      });
    }
    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        erro:
          'Você só pode cancelar agendamentos com duas horas de antecedência .',
      });
    }

    appointment.canceled_at = new Date();
    await appointment.save();
    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento Cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(appointment.date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
      },
    });
    return res.json(appointment);
  }
}

export default new AppointmentController();
