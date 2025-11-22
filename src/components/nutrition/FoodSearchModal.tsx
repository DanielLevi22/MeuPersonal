        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0E1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 14,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  foodItem: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  foodInfo: {
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodCategory: {
    fontSize: 12,
    color: '#8B92A8',
  },
  macrosPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  servingText: {
    fontSize: 11,
    color: '#5A6178',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B92A8',
    marginTop: 16,
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#8B92A8',
    fontSize: 15,
    marginTop: 16,
    textAlign: 'center',
  },
  resultsCount: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#141B2D',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 8,
  },
  resultsCountText: {
    fontSize: 12,
    color: '#8B92A8',
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    color: '#8B92A8',
    fontSize: 13,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  loadMoreText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
  },
});
