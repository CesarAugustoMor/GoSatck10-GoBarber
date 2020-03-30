import User from '../models/User';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    /**
     * Verifica se é um prestador
     **/
    if (
      !(await User.findOne({
        where: { id: req.userId, provider: true },
      }))
    ) {
      return res.status(401).json({
        erro: 'Apenas Prestadores podem carregar notificações.',
      });
    }

    const notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: 'desc' })
      .limit(20);
    return res.json(notifications);
  }
}

export default new NotificationController();
