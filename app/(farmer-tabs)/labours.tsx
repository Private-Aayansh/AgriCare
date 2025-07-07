import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, Filter, PlusSquare, Trash2 } from 'lucide-react-native';
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

  const handleDeleteJob = async (jobId: number) => {
    Alert.alert(
      t('jobCard.deleteConfirmationTitle'),
      t('jobCard.deleteConfirmationMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          onPress: async () => {
            try {
              await apiClient.deleteJob(jobId);
              setJobs(jobs.filter(job => job.id !== jobId));
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
            <Text style={styles.emptyText}>{t('jobList.noJobs.title')}</Text>
            <Text style={styles.emptySubtext}>{t('jobList.noJobs.subtitle')}</Text>
          </View>
        ) : (
          jobs.map(job => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobCardHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <TouchableOpacity onPress={() => handleDeleteJob(job.id)}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.jobDescription}>{job.description}</Text>
              <View style={styles.jobDetailsContainer}>
                <Text style={styles.jobDetailText}>{t('jobCard.wage')}: ₹{job.daily_wage}</Text>
                <Text style={styles.jobDetailText}>{t('jobCard.labourers')}: {job.number_of_labourers}</Text>
              </View>
              <Text style={styles.jobDate}>{t('jobCard.postedOn')}: {new Date(job.created_at).toLocaleDateString()}</Text>
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
    backgroundColor: '#F9FAFB',
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
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
  },
  jobList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    backgroundColor: '#22C55E',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  jobDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  jobDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#374151',
  },
  jobDate: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
});