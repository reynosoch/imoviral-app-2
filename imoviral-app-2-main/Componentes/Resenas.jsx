import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';
import { submitRequest } from './systemSync';

const ADMIN_ID = 'admin-id-0000';

const T = {
  gold: '#A07840',
  goldHover: '#C39B5F',
  bg: '#0A0A0A',
  bgAlt: '#111110',
  bgCard: '#161614',
  bgBeige: '#EAE2D6',
  bgCardBeige: '#FFFFFF',
  text: '#F5F5F0',
  textDark: '#0F0D0A',
  textSub: '#8A8A84',
  textSubDark: '#525252',
  border: 'rgba(255,255,255,0.08)',
  borderBeige: 'rgba(0,0,0,0.05)',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

function StarSelector({ value, onChange, size = 28, readonly = false }) {
  const [hoveredStar, setHoveredStar] = useState(0);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hoveredStar || value);
        return (
          <Pressable
            key={star}
            onPress={() => !readonly && onChange(star)}
            onMouseEnter={() => Platform.OS === 'web' && !readonly && setHoveredStar(star)}
            onMouseLeave={() => Platform.OS === 'web' && !readonly && setHoveredStar(0)}
            style={!readonly ? { cursor: 'pointer' } : {}}
          >
            <FontAwesome
              name={filled ? 'star' : 'star-o'}
              size={size}
              color={filled ? T.gold : 'rgba(160,120,64,0.3)'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function ReviewCard({ item, currentUserId, isAdmin, isModerator, onEdit, onDelete, isBeige }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const canModify = (isAdmin || isModerator || currentUserId === item.user_id) && !item.id.toString().startsWith('default-');
  const bgCard = isBeige ? T.bgCardBeige : T.bgCard;
  const textColor = isBeige ? T.textDark : T.text;
  const subColor = isBeige ? T.textSubDark : T.textSub;

  return (
    <View
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.reviewCard,
        { backgroundColor: bgCard },
        isBeige && { borderColor: T.borderBeige },
        hovered && s.reviewCardHovered,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[s.quoteIcon, { color: T.gold }]}>{'\u201C'}</Text>
        <Text style={[s.reviewText, { color: subColor }]}>{item.comentario}</Text>
      </View>
      <View style={s.reviewSeparator} />
      <View style={s.reviewAuthorRow}>
        {item.avatar || item.avatar_url ? (
          <Image
            source={item.avatar ? item.avatar : { uri: item.avatar_url }}
            style={s.reviewAvatar}
          />
        ) : (
          <View style={[s.reviewAvatarPlaceholder, { backgroundColor: T.gold }]}>
            <Text style={s.reviewAvatarInitials}>
              {(item.user_name || 'U').substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.reviewAuthorName, { color: textColor }]}>{item.user_name}</Text>
          {item.role && <Text style={[s.reviewAuthorRole, { color: T.gold }]}>{item.role}</Text>}
        </View>
      </View>
      <View style={s.reviewBottomRow}>
        <StarSelector value={item.estrellas} readonly size={14} />
        {canModify && (
          <View style={s.reviewActions}>
            <Pressable onPress={() => onEdit(item)} style={s.reviewActionBtn}>
              <FontAwesome name="pencil" size={12} color={T.gold} />
              <Text style={s.reviewActionText}>{t('reviews.edit_btn')}</Text>
            </Pressable>
            <Pressable onPress={() => onDelete(item)} style={s.reviewActionBtn}>
              <FontAwesome name="trash-o" size={12} color="#C05050" />
              <Text style={[s.reviewActionText, { color: '#C05050' }]}>{t('reviews.delete_btn')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function Resenas({ onVolver }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const esES = i18n.language?.startsWith('es') || true;
  const isAdmin = user?.isAdmin || user?.id === ADMIN_ID;
  const isModerator = user?.isModerator || false;

  const [reqTargetReview, setReqTargetReview] = useState(null);
  const [reqReason, setReqReason] = useState('');
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);

  const [adminDeleteReview, setAdminDeleteReview] = useState(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPwdModalVisible, setAdminPwdModalVisible] = useState(false);

  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [stars, setStars] = useState(5);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const defaultResenas = [
    {
      id: 'default-1',
      user_id: 'default-1',
      user_name: 'Mauro Lombardo',
      avatar: require('../assets/mauro.jpg'),
      role: t('testimonials.testi1.r'),
      estrellas: 5,
      comentario: t('testimonials.testi1.q'),
    },
    {
      id: 'default-2',
      user_id: 'default-2',
      user_name: 'Benito Ocasio',
      avatar: require('../assets/benito.jpg'),
      role: t('testimonials.testi2.r'),
      estrellas: 5,
      comentario: t('testimonials.testi2.q'),
    },
    {
      id: 'default-3',
      user_id: 'default-3',
      user_name: 'Michael Torres',
      avatar: require('../assets/michael.jpg'),
      role: t('testimonials.testi3.r'),
      estrellas: 5,
      comentario: t('testimonials.testi3.q'),
    },
  ];

  const todasLasResenas = [...resenas, ...defaultResenas];

  const cargarResenas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resenas')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setResenas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarResenas();
  }, [cargarResenas]);

  useEffect(() => {
    if (user && user.user_metadata?.avatar_url) {
      const syncAvatars = async () => {
        try {
          const { error } = await supabase
            .from('resenas')
            .update({ avatar_url: user.user_metadata.avatar_url })
            .eq('user_id', user.id)
            .is('avatar_url', null);
          if (!error) {
            await cargarResenas();
          }
        } catch (e) {
          console.error(e);
        }
      };
      syncAvatars();
    }
  }, [user, cargarResenas]);

  const handleSubmit = async () => {
    if (!comentario.trim() || stars < 1) return;
    setSubmitting(true);
    try {
      if (editingReview) {
        const { error } = await supabase
          .from('resenas')
          .update({
            estrellas: stars,
            comentario: comentario.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingReview.id);
        if (error) throw error;
        setFeedback(t('reviews.success_updated'));
      } else {
        const { error } = await supabase.from('resenas').insert({
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email || 'Usuario',
          user_email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          estrellas: stars,
          comentario: comentario.trim(),
        });
        if (error) throw error;
        setFeedback(t('reviews.success_created'));
      }
      setFormVisible(false);
      setEditingReview(null);
      setStars(5);
      setComentario('');
      await cargarResenas();
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      setFeedback(t('reviews.error_generic'));
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setStars(review.estrellas);
    setComentario(review.comentario);
    setFormVisible(true);
  };

  const handleDelete = async (review) => {
    if (isModerator && !isAdmin) {
      setReqTargetReview(review);
      setReqReason('');
      setApprovalModalVisible(true);
      return;
    }

    if (isAdmin) {
      setAdminDeleteReview(review);
      setAdminPasswordInput('');
      setAdminPwdModalVisible(true);
      return;
    }

    const confirmed = Platform.OS === 'web'
      ? window.confirm(t('reviews.delete_confirm'))
      : true;
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('resenas').delete().eq('id', review.id);
      if (error) throw error;
      setFeedback(t('reviews.success_deleted'));
      await cargarResenas();
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      setFeedback(t('reviews.error_generic'));
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleSendApprovalRequest = async () => {
    if (!reqReason.trim()) {
      alert(esES ? 'Por favor ingresa una razón.' : 'Please enter a reason.');
      return;
    }
    try {
      await submitRequest({
        id: 'req-' + Date.now(),
        moderatorId: user.id,
        action: 'delete_review',
        targetId: reqTargetReview.id,
        targetName: reqTargetReview.comentario,
        message: reqReason,
        status: 'pending'
      });
      setApprovalModalVisible(false);
      setReqTargetReview(null);
      setFeedback(esES ? 'Solicitud de eliminación enviada al administrador.' : 'Delete request submitted to administrator.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Error al enviar la solicitud.');
    }
  };

  const handleConfirmAdminDelete = async () => {
    if (adminPasswordInput !== 'admin') {
      alert(esES ? 'Contraseña incorrecta.' : 'Incorrect password.');
      return;
    }
    try {
      const { error } = await supabase.from('resenas').delete().eq('id', adminDeleteReview.id);
      if (error) throw error;
      setAdminPwdModalVisible(false);
      setAdminDeleteReview(null);
      setFeedback(t('reviews.success_deleted'));
      await cargarResenas();
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Error al eliminar la reseña.');
    }
  };

  const handleCancel = () => {
    setFormVisible(false);
    setEditingReview(null);
    setStars(5);
    setComentario('');
  };

  const numCols = width > 1024 ? 3 : width > 640 ? 2 : 1;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.page} contentContainerStyle={s.pageContent}>
        {/* Hero */}
        <View style={[s.heroSection, !isWide && { paddingTop: 20 }]}>
          <View style={s.heroInner}>
            <Text style={s.heroLabel}>{t('reviews.page_label')}</Text>
            <Text style={s.heroTitle}>{t('reviews.page_title')}</Text>
            <Text style={s.heroSub}>{t('reviews.page_subtitle')}</Text>
          </View>
        </View>

        {/* Feedback */}
        {feedback !== '' && (
          <View style={s.feedbackBar}>
            <Text style={s.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* Write review button */}
        {user && !formVisible && (
          <View style={s.writeSection}>
            <Pressable style={s.writeBtn} onPress={() => setFormVisible(true)}>
              <FontAwesome name="pencil" size={14} color="#000" style={{ marginRight: 10 }} />
              <Text style={s.writeBtnText}>{t('reviews.write_review')}</Text>
            </Pressable>
          </View>
        )}

        {!user && (
          <View style={s.writeSection}>
            <Text style={s.loginHint}>{t('reviews.login_required')}</Text>
          </View>
        )}

        {/* Review Form */}
        {formVisible && (
          <View style={[s.formContainer, { maxWidth: isWide ? 600 : '100%' }]}>
            <Text style={s.formTitle}>{editingReview ? t('reviews.form_title') : t('reviews.form_title')}</Text>
            <Text style={s.formSubtitle}>{t('reviews.form_subtitle')}</Text>
            <View style={s.formStarsRow}>
              <Text style={s.formStarsLabel}>{t('reviews.stars_label')}</Text>
              <StarSelector value={stars} onChange={setStars} />
            </View>
            <TextInput
              style={s.formInput}
              placeholder={t('reviews.form_placeholder')}
              placeholderTextColor="rgba(242,237,229,0.3)"
              value={comentario}
              onChangeText={setComentario}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={s.formBtnsRow}>
              <Pressable style={s.formSubmitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={s.formSubmitText}>
                    {editingReview ? t('reviews.form_update') : t('reviews.form_submit')}
                  </Text>
                )}
              </Pressable>
              <Pressable style={s.formCancelBtn} onPress={handleCancel}>
                <Text style={s.formCancelText}>{t('reviews.form_cancel')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Reviews Grid */}
        <View style={[s.gridSection, { paddingHorizontal: isWide ? 48 : 16 }]}>
          {loading ? (
            <View style={s.centerLoader}>
              <ActivityIndicator size="large" color={T.gold} />
            </View>
          ) : todasLasResenas.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>{t('reviews.empty')}</Text>
            </View>
          ) : (
            <View style={s.gridWrapper}>
              {todasLasResenas.map((item) => (
                <View key={item.id} style={{ width: `${100 / numCols}%`, padding: 10 }}>
                  <ReviewCard
                    item={item}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    isModerator={isModerator}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isBeige={false}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Back Button */}
        {onVolver && (
          <Pressable style={s.backBtn} onPress={onVolver}>
            <Text style={s.backBtnText}>{t('vd_back')}</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Approval request modal for moderator */}
      {approvalModalVisible && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{esES ? 'Solicitud de Moderación' : 'Moderation Request'}</Text>
            <Text style={s.modalText}>
              {esES 
                ? 'Como moderador, necesitas aprobación del administrador para eliminar esta reseña. Ingresa el motivo:' 
                : 'As a moderator, you need admin approval to delete this review. Enter the reason:'}
            </Text>
            <TextInput
              style={s.modalInput}
              value={reqReason}
              onChangeText={setReqReason}
              placeholder={esES ? 'Motivo de la solicitud' : 'Reason for request'}
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={3}
            />
            <View style={s.modalButtons}>
              <Pressable style={[s.modalBtn, s.modalBtnCancel]} onPress={() => setApprovalModalVisible(false)}>
                <Text style={s.modalBtnCancelText}>{t('reviews.form_cancel', { defaultValue: 'Cancelar' })}</Text>
              </Pressable>
              <Pressable style={[s.modalBtn, s.modalBtnConfirm]} onPress={handleSendApprovalRequest}>
                <Text style={s.modalBtnConfirmText}>{esES ? 'Enviar' : 'Send'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Password verification modal for admin */}
      {adminPwdModalVisible && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{esES ? 'Confirmación de Seguridad' : 'Security Confirmation'}</Text>
            <Text style={s.modalText}>
              {esES 
                ? 'Ingresa la contraseña de administrador para realizar esta acción:' 
                : 'Enter the admin password to perform this action:'}
            </Text>
            <TextInput
              style={s.modalInput}
              value={adminPasswordInput}
              onChangeText={setAdminPasswordInput}
              secureTextEntry
              placeholder={esES ? 'Contraseña' : 'Password'}
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <View style={s.modalButtons}>
              <Pressable style={[s.modalBtn, s.modalBtnCancel]} onPress={() => setAdminPwdModalVisible(false)}>
                <Text style={s.modalBtnCancelText}>{t('reviews.form_cancel', { defaultValue: 'Cancelar' })}</Text>
              </Pressable>
              <Pressable style={[s.modalBtn, s.modalBtnConfirm]} onPress={handleConfirmAdminDelete}>
                <Text style={s.modalBtnConfirmText}>{esES ? 'Confirmar' : 'Confirm'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  pageContent: { paddingBottom: 60 },

  heroSection: {
    backgroundColor: T.bgAlt,
    paddingTop: 100,
    paddingBottom: 60,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  heroInner: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  heroLabel: {
    color: T.gold,
    fontSize: 11,
    fontFamily: T.sans,
    letterSpacing: 4,
    fontWeight: '600',
    marginBottom: 16,
  },
  heroTitle: {
    color: T.text,
    fontSize: 38,
    lineHeight: 44,
    fontFamily: T.serif,
    fontWeight: '400',
    marginBottom: 16,
  },
  heroSub: {
    color: T.textSub,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: T.sans,
    fontWeight: '300',
  },

  feedbackBar: {
    backgroundColor: 'rgba(160,120,64,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 32,
    marginTop: 20,
    alignSelf: 'center',
    maxWidth: 600,
    width: '100%',
  },
  feedbackText: { color: T.gold, fontSize: 13, fontFamily: T.sans, textAlign: 'center' },

  writeSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.gold,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  writeBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: T.sans,
    fontWeight: '600',
    letterSpacing: 2,
  },
  loginHint: {
    color: T.textSub,
    fontSize: 13,
    fontFamily: T.sans,
    fontStyle: 'italic',
  },

  formContainer: {
    backgroundColor: T.bgAlt,
    borderWidth: 1,
    borderColor: T.border,
    padding: 32,
    marginHorizontal: 32,
    marginBottom: 32,
    alignSelf: 'center',
    width: '100%',
  },
  formTitle: { color: T.text, fontSize: 22, fontFamily: T.serif, marginBottom: 6 },
  formSubtitle: { color: T.textSub, fontSize: 12, fontFamily: T.sans, marginBottom: 24 },
  formStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  formStarsLabel: { color: T.textSub, fontSize: 12, fontFamily: T.sans, letterSpacing: 1 },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.2)',
    color: T.text,
    fontFamily: T.sans,
    fontSize: 13,
    padding: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  formBtnsRow: { flexDirection: 'row', gap: 12 },
  formSubmitBtn: {
    backgroundColor: T.gold,
    paddingVertical: 14,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSubmitText: { color: '#000', fontSize: 11, fontFamily: T.sans, fontWeight: '600', letterSpacing: 2 },
  formCancelBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCancelText: { color: T.textSub, fontSize: 11, fontFamily: T.sans, letterSpacing: 2 },

  gridSection: { paddingTop: 20 },
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap' },
  centerLoader: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: T.textSub, fontSize: 14, fontFamily: T.sans, fontStyle: 'italic' },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#A07840',
    padding: 24,
    borderRadius: 4,
  },
  modalTitle: {
    color: '#A07840',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: T.sans,
    textTransform: 'uppercase',
  },
  modalText: {
    color: '#8A8A84',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: T.sans,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    color: '#F5F5F0',
    padding: 12,
    marginBottom: 18,
    fontSize: 13,
    fontFamily: T.sans,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnCancelText: {
    color: '#8A8A84',
    fontSize: 11.5,
    fontFamily: T.sans,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    backgroundColor: '#A07840',
  },
  modalBtnConfirmText: {
    color: '#000',
    fontSize: 11.5,
    fontFamily: T.sans,
    fontWeight: '600',
  },

  reviewCard: {
    padding: 28,
    borderWidth: 1,
    borderColor: T.border,
    height: '100%',
    ...Platform.select({
      web: { transition: 'transform 0.3s ease, box-shadow 0.3s ease' },
      default: {},
    }),
  },
  reviewCardHovered: {
    transform: [{ translateY: -4 }],
    ...Platform.select({
      web: { boxShadow: '0 12px 24px rgba(0,0,0,0.2)' },
      default: {},
    }),
  },
  quoteIcon: { fontSize: 48, lineHeight: 36, height: 28, marginBottom: 8, fontFamily: 'Georgia, serif' },
  reviewText: { fontSize: 14, lineHeight: 22, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 20 },
  reviewSeparator: { height: 1, backgroundColor: T.border, marginBottom: 16 },
  reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarInitials: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  reviewAuthorName: { fontSize: 13, fontWeight: '600', fontFamily: 'Montserrat, sans-serif' },
  reviewAuthorRole: { fontSize: 11, fontFamily: 'Montserrat, sans-serif' },
  reviewBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewActions: { flexDirection: 'row', gap: 14 },
  reviewActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reviewActionText: { color: T.gold, fontSize: 11, fontFamily: T.sans },

  backBtn: {
    alignSelf: 'center',
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: T.textSub, fontSize: 10, letterSpacing: 2, fontFamily: T.sans, fontWeight: '500' },
});
