import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';

import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';

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
    if (
      !(await User.findOne({
        where: { id: provider_id, provider: true },
      }))
    ) {
      return res
        .status(401)
        .json({ erro: 'Você só pode criar agendamentos com Prestadores.' });
    }

    /**
     * verifica agendamento no passado.
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ erro: 'Datas no passado não são permitidas.' });
    }

    /**
     * Verifica se a data horário está disponivel.
     */

    if (
      await Appointment.findOne({
        where: {
          providers_id,
          canceled_at: null,
          data: hourStart,
        },
      })
    ) {
      return res
        .status(400)
        .json({ erro: 'Data de agendamento não disponivel.' });
    }

    return res.json(
      await Appointment.create({
        user_id: req.userId,
        provider_id,
        date: hourStart,
      })
    );
  }
}

export default new AppointmentController();
