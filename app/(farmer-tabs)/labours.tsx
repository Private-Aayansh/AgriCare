import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, Filter, SquarePlus as PlusSquare, Trash2, MapPin, Calendar, Users, DollarSign, Clock, Star, Briefcase } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '../../utils/api';
import { Job } from '../../types/job';

export default function FarmerLabours() {
  const { t } = useLanguage();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const fetchedJobs = await apiClient.getJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      Alert.alert(t('errors.fetchErrorTitle'), t('errors.fetchErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const handleDeleteJob = async (job: Job) => {
    Alert.alert(
      t('jobCard.deleteConfirmationTitle'),
      `${t('jobCard.deleteConfirmationMessage')}\n\nJob: "${job.title}"`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          onPress: async () => {
            try {
              await apiClient.deleteJob(job.id);
              setJobs(jobs.filter(j => j.id !== job.id));
              Alert.alert(t('jobCard.deleteSuccessTitle'), t('jobCard.deleteSuccessMessage'));
            } catch (error) {
              console.error('Failed to delete job:', error);
              Alert.alert(t('errors.deleteErrorTitle'), t('errors.deleteErrorMessage'));
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#22C55E'; // Active
      case 2: return '#F59E0B'; // In Progress
      case 3: return '#6B7280'; // Completed
      case 0: return '#EF4444'; // Cancelled
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Active';
      case 2: return 'In Progress';
      case 3: return 'Completed';
      case 0: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('dashboard.farmer.labours')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.jobList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#22C55E" style={{ marginTop: 50 }} />
        ) : jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Briefcase size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('jobList.noJobs.title')}</Text>
            <Text style={styles.emptySubtext}>{t('jobList.noJobs.subtitle')}</Text>
          </View>
        ) : (
          jobs.map(job => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobCardHeader}>
                <View style={styles.jobTitleSection}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => handleDeleteJob(job)} 
                  style={styles.deleteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.jobDescription} numberOfLines={2}>{job.description}</Text>

              <View style={styles.jobMetrics}>
                <View style={styles.metricItem}>
                  <DollarSign size={16} color="#22C55E" />
                  <Text style={styles.metricValue}>₹{job.daily_wage}</Text>
                  <Text style={styles.metricLabel}>per day</Text>
                </View>
                <View style={styles.metricItem}>
                  <Users size={16} color="#3B82F6" />
                  <Text style={styles.metricValue}>{job.number_of_labourers}</Text>
                  <Text style={styles.metricLabel}>labourers</Text>
                </View>
              </View>

              <View style={styles.jobDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.detailText}>{job.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {formatDate(job.start_date)}
                    {job.end_date && ` - ${formatDate(job.end_date)}`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Starts at {formatTime(job.start_date)}
                  </Text>
                </View>
              </View>

              {job.required_skills && job.required_skills.length > 0 && (
                <View style={styles.skillsSection}>
                  <Text style={styles.skillsLabel}>Required Skills:</Text>
                  <View style={styles.skillsContainer}>
                    {job.required_skills.slice(0, 3).map((skill, index) => (
                      <View key={index} style={styles.skillBadge}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                    {job.required_skills.length > 3 && (
                      <View style={styles.skillBadge}>
                        <Text style={styles.skillText}>+{job.required_skills.length - 3}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {job.perks && job.perks.length > 0 && (
                <View style={styles.perksSection}>
                  <Star size={14} color="#F59E0B" />
                  <Text style={styles.perksText}>{job.perks.join(' • ')}</Text>
                </View>
              )}

              <View style={styles.jobFooter}>
                <Text style={styles.jobId}>Job #{job.id}</Text>
                <Text style={styles.postedDate}>
                  Posted {job.created_at ? formatDate(job.created_at) : 'recently'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-job-modal')}>
        <PlusSquare size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  filterButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  jobList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    right: 24,
    bottom: 24,
    backgroundColor: '#22C55E',
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 16,
  },
  jobMetrics: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  jobDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  perksSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  perksText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  jobId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  postedDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
});