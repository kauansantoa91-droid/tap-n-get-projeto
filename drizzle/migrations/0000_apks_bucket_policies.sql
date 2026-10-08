
CREATE POLICY "apks_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'apks');
CREATE POLICY "apks_insert_all" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'apks');
CREATE POLICY "apks_update_all" ON storage.objects FOR UPDATE USING (bucket_id = 'apks');
CREATE POLICY "apks_delete_all" ON storage.objects FOR DELETE USING (bucket_id = 'apks');
