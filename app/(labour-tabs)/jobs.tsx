import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { MapPin, Calendar, Briefcase, MessageSquare, AlertCircle, Filter, DollarSign, Users, Clock, Star } from 'lucide-react-native';
import { apiClient } from '../../utils/api';
import { getCurrentLocation, requestLocationPermission } from '../../utils/location';
import { Job } from '../../types/job';
import { useRouter } from 'expo-router';
import RadiusFilterModal from '../../components/RadiusFilterModal';

export default function LabourJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useState(2);
  const [showRadiusModal, setShowRadiusModal] = useState(false);

  const fetchNearbyJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to find nearby jobs.',
          [{ text: 'OK' }]
        );
        setError('Location permission denied.');
        return;
      }

      const location = await getCurrentLocation();
      if (location) {
        const nearbyJobs = await apiClient.getNearbyJobs(location.latitude, location.longitude, radius);
        setJobs(nearbyJobs);
      } else {
        setError('Could not determine your location.');
        Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      Alert.alert('Error', 'Failed to fetch nearby jobs. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [radius]);

  useEffect(() => {
    fetchNearbyJobs();
  }, [fetchNearbyJobs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNearbyJobs().finally(() => setRefreshing(false));
  }, [fetchNearbyJobs]);

  const handleMessagePress = (job: Job) => {
    // Navigate to chat screen with farmer info
    router.push(`/chat/${job.farmer_id}`);
    Alert.alert('Coming Soon', 'The chat functionality will be implemented in a future update.');
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    setShowRadiusModal(false);
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
      case 1: return 'Open';
      case 2: return 'In Progress';
      case 3: return 'Completed';
      case 0: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Finding jobs near you...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <AlertCircle size={40} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNearbyJobs}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (jobs.length === 0) {
      return (
        <View style={styles.centered}>
          <Briefcase size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No jobs found within {radius}km of your location.</Text>
          <Text style={styles.emptySubText}>Try increasing the search radius or check back later.</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.jobsList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8B4513"]} />}
      >
        {jobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View style={styles.jobTitleSection}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
                </View>
              </View>
              <View style={styles.wageSection}>
                <Text style={styles.jobWage}>₹{job.daily_wage}</Text>
                <Text style={styles.wageLabel}>per day</Text>
              </View>
            </View>

            <Text style={styles.jobDescription} numberOfLines={2}>{job.description}</Text>

            <View style={styles.jobMetrics}>
              <View style={styles.metricItem}>
                <Users size={16} color="#3B82F6" />
                <Text style={styles.metricText}>{job.number_of_labourers} needed</Text>
              </View>
              <View style={styles.metricItem}>
                <MapPin size={16} color="#EF4444" />
                <Text style={styles.metricText}>{job.distance?.toFixed(2) ?? '...'} km away</Text>
              </View>
            </View>

            <View style={styles.jobDetails}>
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
              <View style={styles.detailRow}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.detailText}>{job.location}</Text>
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
              <View style={styles.farmerInfo}>
                <Text style={styles.farmerText}>
                  {job.farmer_name ? `by ${job.farmer_name}` : 'Posted recently'}
                </Text>
                <Text style={styles.jobId}>Job #{job.id}</Text>
              </View>
              <TouchableOpacity style={styles.messageButton} onPress={() => handleMessagePress(job)}>
                <MessageSquare size={18} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Jobs</Text>
        <TouchableOpacity onPress={() => setShowRadiusModal(true)} style={styles.filterButton}>
          <Filter size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
      {renderContent()}
      <RadiusFilterModal
        isVisible={showRadiusModal}
        currentRadius={radius}
        onClose={() => setShowRadiusModal(false)}
        onApply={handleRadiusChange}
      />
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
  filterButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  jobsList: {
    flex: 1,
    padding: 24,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleSection: {
    flex: 1,
    marginRight: 16,
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
  wageSection: {
    alignItems: 'flex-end',
  },
  jobWage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B4513',
  },
  wageLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  jobDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 16,
  },
  jobMetrics: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
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
    fontWeight: '500',
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
  farmerInfo: {
    flex: 1,
  },
  farmerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  jobId: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});